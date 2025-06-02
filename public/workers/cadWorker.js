// Next.js用CADワーカー - CascadeStudioMainWorkerを参考に実装

// 🔥 WebWorker起動確認 - 最初に実行される
console.log("🎬 Worker script loaded, sending alive signal...");
postMessage({ type: "log", payload: "[Worker] 🎬 WebWorker script loaded successfully!" });
postMessage({ type: "log", payload: "[Worker] 🌐 Environment check starting..." });

// グローバル変数の定義
var oc = null;
var externalShapes = {};
var sceneShapes = [];
var GUIState = {};
var currentShape = null;
var opNumber = 0;
var currentOp = '';
var currentLineNumber = 0;

// より詳細なログとエラーの捕捉
let realConsoleLog = console.log;
let realConsoleError = console.error;

console.log = function (message) {
  // WebWorkerのログをメインスレッドに送信
  postMessage({ type: "log", payload: `[Worker] ${message}` });
  realConsoleLog.apply(console, arguments);
};

console.error = function (err, url, line, colno, errorObj) {
  // エラーもメインスレッドに送信
  postMessage({ type: "log", payload: `[Worker Error] ${err}` });
  postMessage({ type: "resetWorking" });
  setTimeout(() => {
    if (err && err.message) {
      err.message = "INTERNAL OPENCASCADE ERROR DURING GENERATE: " + err.message;
    }
    throw err; 
  }, 0);
  realConsoleError.apply(console, arguments);
};

// 基本的な環境チェック
console.log(`🔧 Worker environment: ${typeof importScripts !== 'undefined' ? 'OK' : 'NG'}`);
console.log(`🔧 Worker self: ${typeof self !== 'undefined' ? 'OK' : 'NG'}`);

// OpenCascade.js読み込み（デバッグ強化版）
let ocInitialized = false;
var messageHandlers = {};

async function initializeOpenCascade() {
  console.log("🚀 Starting OpenCascade initialization...");
  
  try {
    console.log("📁 Loading OpenCascade v1.1.1 from local files...");
    console.log("📡 URL: /opencascade/opencascade.wasm.js");
    
    // ES Modules形式のファイルをfetch()で読み込み、export文を削除してからeval()で実行
    console.log("📦 Fetching OpenCascade.js file...");
    const response = await fetch('/opencascade/opencascade.wasm.js');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch OpenCascade.js: ${response.status} ${response.statusText}`);
    }
    
    console.log("📦 Reading file content...");
    let jsCode = await response.text();
    
    console.log("🔧 Processing ES Modules format...");
    // export文を削除（ES Modules形式をWebWorker対応に変換）
    jsCode = jsCode.replace(/export\s+default\s+[^;]+;?\s*$/, '');
    
    console.log("📦 Executing OpenCascade.js code...");
    // グローバルスコープで実行
    eval(jsCode);
    
    console.log("✅ OpenCascade.js code executed successfully");
    
    // opencascade関数の存在確認
    if (typeof opencascade === 'undefined') {
      throw new Error("opencascade function not available after execution");
    }
    
    console.log("🔧 opencascade function found, initializing...");
    
    // OpenCascadeの初期化（v1.1.1 形式）
    const openCascade = await opencascade({
      locateFile(path) {
        console.log(`🔍 Locating file: ${path}`);
        if (path.endsWith('.wasm')) {
          console.log("🎯 WASM file requested, returning: /opencascade/opencascade.wasm.wasm");
          return '/opencascade/opencascade.wasm.wasm';
        }
        return path;
      }
    });
    
    console.log("🎉 OpenCascade instance created successfully!");
    
    oc = openCascade;
    ocInitialized = true;
    
    // 初期化完了を通知
    postMessage({ type: "startupCallback" });
    console.log("✅ OpenCascade v1.1.1 initialized successfully from local files");
    return;
    
  } catch (error) {
    console.log("❌ Failed to load from local files");
    console.log(`❌ Error type: ${error.constructor.name}`);
    console.log(`❌ Error message: ${error.message}`);
    console.log(`❌ Error stack: ${error.stack}`);
    
    postMessage({ 
      type: "error", 
      payload: { 
        message: `Failed to load OpenCascade.js from local files: ${error.message}` 
      } 
    });
  }
}

// 初期化を開始する前に、WebWorkerが完全に準備完了していることを確認
console.log("🎬 Worker script loaded, starting initialization...");
setTimeout(() => {
  console.log("⏰ Starting initialization with delay...");
  initializeOpenCascade();
}, 100);

// メッセージハンドラーの定義
onmessage = function (e) {
  if (!ocInitialized) {
    console.warn("OpenCascade not yet initialized, message queued");
    // 初期化完了まで待ってから再試行
    setTimeout(() => onmessage(e), 100);
    return;
  }
  
  let response = messageHandlers[e.data.type] && messageHandlers[e.data.type](e.data.payload);
  if (response) { 
    postMessage({ "type": e.data.type, payload: response }); 
  }
};

// 基本的なCAD標準ライブラリ関数
function Box(x, y, z, centered = false) {
  if (!oc) throw new Error("OpenCascade not initialized");
  
  // より安全なコンストラクタを使用（3パラメーター版）
  const box = new oc.BRepPrimAPI_MakeBox_1(x, y, z).Shape();
  if (centered) {
    const translatedBoxes = Translate([-x / 2, -y / 2, -z / 2], [box]);
    sceneShapes.push(translatedBoxes[0]);
    return translatedBoxes[0];
  }
  
  sceneShapes.push(box);
  return box;
}

function Sphere(radius) {
  if (!oc) throw new Error("OpenCascade not initialized");
  
  // より安全なコンストラクタを使用
  const sphere = new oc.BRepPrimAPI_MakeSphere_1(radius).Shape();
  
  sceneShapes.push(sphere);
  return sphere;
}

function Cylinder(radius, height, centered = false) {
  if (!oc) throw new Error("OpenCascade not initialized");
  
  // より安全なコンストラクタを使用
  const cylinder = new oc.BRepPrimAPI_MakeCylinder_1(radius, height).Shape();
  
  if (centered) {
    const translatedCylinders = Translate([0, 0, -height / 2], [cylinder]);
    sceneShapes.push(translatedCylinders[0]);
    return translatedCylinders[0];
  }
  
  sceneShapes.push(cylinder);
  return cylinder;
}

function Union(shapes) {
  if (!oc || !Array.isArray(shapes) || shapes.length === 0) return null;
  
  let result = shapes[0];
  for (let i = 1; i < shapes.length; i++) {
    try {
      const fuse = new oc.BRepAlgoAPI_Fuse_1();
      fuse.SetArguments([result]);
      fuse.SetTools([shapes[i]]);
      fuse.Build();
      result = fuse.Shape();
    } catch (fuseError) {
      console.log(`⚠️ Union failed, using first shape: ${fuseError.message}`);
      result = shapes[0]; // フォールバック
      break;
    }
  }
  
  sceneShapes.push(result);
  return result;
}

function Difference(mainShape, subtractShapes) {
  if (!oc || !mainShape) return null;
  
  let result = mainShape;
  const shapesToSubtract = Array.isArray(subtractShapes) ? subtractShapes : [subtractShapes];
  
  for (const shape of shapesToSubtract) {
    try {
      const cut = new oc.BRepAlgoAPI_Cut_1();
      cut.SetArguments([result]);
      cut.SetTools([shape]);
      cut.Build();
      result = cut.Shape();
    } catch (cutError) {
      console.log(`⚠️ Difference failed, using main shape: ${cutError.message}`);
      result = mainShape; // フォールバック
      break;
    }
  }
  
  sceneShapes.push(result);
  return result;
}

function Intersection(shapes) {
  if (!oc || !Array.isArray(shapes) || shapes.length < 2) return null;
  
  let result = shapes[0];
  for (let i = 1; i < shapes.length; i++) {
    try {
      const common = new oc.BRepAlgoAPI_Common_1();
      common.SetArguments([result]);
      common.SetTools([shapes[i]]);
      common.Build();
      result = common.Shape();
    } catch (commonError) {
      console.log(`⚠️ Intersection failed, using first shape: ${commonError.message}`);
      result = shapes[0]; // フォールバック
      break;
    }
  }
  
  sceneShapes.push(result);
  return result;
}

function Translate(offset, shapes) {
  if (!oc || !Array.isArray(offset) || offset.length !== 3) return shapes;
  
  const tf = new oc.gp_Trsf_1();
  tf.SetTranslation_1(new oc.gp_Vec_4(offset[0], offset[1], offset[2]));
  const loc = new oc.TopLoc_Location_2(tf);
  
  return shapes.map(shape => shape.Moved(loc));
}

function Rotate(axis, degrees, shapes) {
  if (!oc || !Array.isArray(axis) || axis.length !== 3) return shapes;
  
  const tf = new oc.gp_Trsf_1();
  const radians = degrees * Math.PI / 180;
  tf.SetRotation_1(
    new oc.gp_Ax1_2(
      new oc.gp_Pnt_1(0, 0, 0), 
      new oc.gp_Dir_4(axis[0], axis[1], axis[2])
    ), 
    radians
  );
  const loc = new oc.TopLoc_Location_2(tf);
  
  return shapes.map(shape => shape.Moved(loc));
}

// 基本的な形状→メッシュ変換（v1.1.1対応版）
function ShapeToMesh(shape, deflection = 0.1) {
  if (!oc || !shape) return null;
  
  try {
    console.log("🔧 Starting mesh conversion...");
    
    // メッシュ化（シンプル版）
    new oc.BRepMesh_IncrementalMesh_2(shape, deflection, false, 0.5, false);
    
    const vertices = [];
    const normals = [];
    const indices = [];
    let vertexIndex = 0;
    
    console.log("🔍 Exploring faces...");
    
    // フェース探索（シンプル版）
    const explorer = new oc.TopExp_Explorer_2(shape, oc.TopAbs_ShapeEnum.TopAbs_FACE, oc.TopAbs_ShapeEnum.TopAbs_SHAPE);
    
    let faceCount = 0;
    while (explorer.More()) {
      faceCount++;
      console.log(`🔍 Processing face ${faceCount}...`);
      
      const face = oc.TopoDS.Face_1(explorer.Current());
      
      // 三角形メッシュの取得（エラーハンドリング強化）
      try {
        const location = new oc.TopLoc_Location_1();
        const triangulation = oc.BRep_Tool.Triangulation(face, location);
        
        if (!triangulation.IsNull()) {
          // v1.1.1対応: NbNodesの代わりに適切なメソッドを使用
          let nodeCount = 0;
          let triangleCount = 0;
          
          try {
            nodeCount = triangulation.get().NbNodes();
            triangleCount = triangulation.get().NbTriangles();
          } catch (methodError) {
            console.log(`⚠️ Face ${faceCount}: Cannot access triangulation methods`);
            explorer.Next();
            continue;
          }
          
          console.log(`📊 Face ${faceCount}: ${nodeCount} nodes, ${triangleCount} triangles`);
          
          // 頂点の抽出（シンプル版）
          const startVertexIndex = vertexIndex;
          
          for (let i = 1; i <= nodeCount; i++) {
            try {
              const node = triangulation.get().Node(i);
              vertices.push(node.X(), node.Y(), node.Z());
              normals.push(0, 0, 1); // 簡略化された法線
              vertexIndex++;
            } catch (nodeError) {
              console.log(`⚠️ Error accessing node ${i}: ${nodeError.message}`);
            }
          }
          
          // インデックスの抽出（シンプル版）
          for (let i = 1; i <= triangleCount; i++) {
            try {
              const triangle = triangulation.get().Triangle(i);
              let n1 = triangle.Value(1);
              let n2 = triangle.Value(2);
              let n3 = triangle.Value(3);
              
              indices.push(
                startVertexIndex + n1 - 1,
                startVertexIndex + n2 - 1,
                startVertexIndex + n3 - 1
              );
            } catch (triangleError) {
              console.log(`⚠️ Error accessing triangle ${i}: ${triangleError.message}`);
            }
          }
        } else {
          console.log(`⚠️ Face ${faceCount}: No triangulation available`);
        }
      } catch (faceError) {
        console.log(`❌ Error processing face ${faceCount}: ${faceError.message}`);
      }
      
      explorer.Next();
    }
    
    console.log(`✅ Mesh conversion completed: ${vertices.length / 3} vertices, ${indices.length / 3} triangles`);
    
    return {
      vertices: new Float32Array(vertices),
      normals: new Float32Array(normals),
      indices: new Uint16Array(indices)
    };
  } catch (error) {
    console.log(`❌ Error in ShapeToMesh: ${error.message}`);
    console.log(`❌ Error stack: ${error.stack}`);
    return null;
  }
}

// メッセージハンドラーの実装
messageHandlers["Evaluate"] = function(payload) {
  try {
    opNumber = 0;
    GUIState = payload.GUIState || {};
    sceneShapes = []; // シーン形状をクリア
    
    postMessage({ type: "log", payload: "🔍 Evaluating CAD code..." });
    postMessage({ type: "log", payload: `📝 Code: ${payload.code.substring(0, 100)}...` });
    
    // コードの評価
    const func = new Function(`
      ${payload.code}
    `);
    
    postMessage({ type: "log", payload: "⚙️ Executing CAD function..." });
    func();
    
    postMessage({ type: "log", payload: `✅ Evaluation completed. Generated ${sceneShapes.length} shapes.` });
    
    // 自動的にメッシュ変換と表示を実行
    if (sceneShapes.length > 0) {
      postMessage({ type: "log", payload: "🎨 Auto-rendering shapes..." });
      
      // combineAndRenderShapesを自動実行
      const renderResult = messageHandlers["combineAndRenderShapes"]({
        maxDeviation: GUIState["MeshRes"] || 0.1,
        sceneOptions: {}
      });
      
      if (renderResult) {
        postMessage({ 
          type: "combineAndRenderShapes", 
          payload: renderResult 
        });
      }
    }
    
    postMessage({ type: "resetWorking" });
    postMessage({ 
      type: "Evaluate", 
      payload: { success: true, shapeCount: sceneShapes.length } 
    });
    
    return { success: true, shapeCount: sceneShapes.length };
  } catch (e) {
    console.error("❌ Evaluation error:", e);
    postMessage({ type: "log", payload: `❌ Evaluation error: ${e.message}` });
    postMessage({ type: "error", payload: { message: `Evaluation error: ${e.message}` } });
    postMessage({ type: "resetWorking" });
    return { success: false, error: e.message };
  }
};

messageHandlers["combineAndRenderShapes"] = function(payload) {
  try {
    if (sceneShapes.length === 0) {
      console.warn("No scene shapes to render");
      return null;
    }
    
    postMessage({ type: "log", payload: `Combining ${sceneShapes.length} shapes...` });
    
    // 複合形状の作成
    currentShape = new oc.TopoDS_Compound();
    let sceneBuilder = new oc.BRep_Builder();
    sceneBuilder.MakeCompound(currentShape);
    
    for (let shape of sceneShapes) {
      if (shape && !shape.IsNull()) {
        sceneBuilder.Add(currentShape, shape);
      }
    }
    
    postMessage({ type: "log", payload: "Converting to mesh..." });
    
    // メッシュ化
    const meshData = ShapeToMesh(currentShape, payload.maxDeviation || 0.1);
    
    if (meshData) {
      postMessage({ type: "log", payload: `Mesh generated: ${meshData.vertices.length / 3} vertices, ${meshData.indices.length / 3} triangles` });
    }
    
    sceneShapes = []; // レンダリング後にクリア
    
    return [
      { faces: meshData, edges: null },
      payload.sceneOptions || {}
    ];
  } catch (e) {
    console.error("Combine and render error:", e);
    return null;
  }
};

// グローバル関数として標準ライブラリ関数を定義
self.Box = Box;
self.Sphere = Sphere;
self.Cylinder = Cylinder;
self.Union = Union;
self.Difference = Difference;
self.Intersection = Intersection;
self.Translate = Translate;
self.Rotate = Rotate;