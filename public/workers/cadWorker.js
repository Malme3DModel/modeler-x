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
    
    // ローカルファイルからOpenCascade.js v1.1.1を読み込み
    console.log("📦 Executing importScripts...");
    importScripts('/opencascade/opencascade.wasm.js');
    console.log("✅ importScripts completed successfully");
    
    // opencascade関数の存在確認（v1.1.1では initOpenCascade 関数）
    if (typeof initOpenCascade === 'undefined') {
      throw new Error("initOpenCascade function not available after import from local files");
    }
    
    console.log("🔧 initOpenCascade function found, initializing...");
    
    // OpenCascadeの初期化（v1.1.1 形式）
    const openCascade = await initOpenCascade({
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
  
  const box = new oc.BRepPrimAPI_MakeBox_2(x, y, z).Shape();
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
  
  const spherePlane = new oc.gp_Ax2_1(
    new oc.gp_Pnt_1(0, 0, 0), 
    new oc.gp_Dir_1(0, 0, 1)
  );
  const sphere = new oc.BRepPrimAPI_MakeSphere_2(spherePlane, radius).Shape();
  
  sceneShapes.push(sphere);
  return sphere;
}

function Cylinder(radius, height, centered = false) {
  if (!oc) throw new Error("OpenCascade not initialized");
  
  const cylinderPlane = new oc.gp_Ax2_1(
    new oc.gp_Pnt_1(0, 0, 0), 
    new oc.gp_Dir_1(0, 0, 1)
  );
  const cylinder = new oc.BRepPrimAPI_MakeCylinder_2(cylinderPlane, radius, height).Shape();
  
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
    const fuse = new oc.BRepAlgoAPI_Fuse_3(result, shapes[i], new oc.Message_ProgressRange_1());
    fuse.Build(new oc.Message_ProgressRange_1());
    result = fuse.Shape();
  }
  
  sceneShapes.push(result);
  return result;
}

function Difference(mainShape, subtractShapes) {
  if (!oc || !mainShape) return null;
  
  let result = mainShape;
  const shapesToSubtract = Array.isArray(subtractShapes) ? subtractShapes : [subtractShapes];
  
  for (const shape of shapesToSubtract) {
    const cut = new oc.BRepAlgoAPI_Cut_3(result, shape, new oc.Message_ProgressRange_1());
    cut.Build(new oc.Message_ProgressRange_1());
    result = cut.Shape();
  }
  
  sceneShapes.push(result);
  return result;
}

function Intersection(shapes) {
  if (!oc || !Array.isArray(shapes) || shapes.length < 2) return null;
  
  let result = shapes[0];
  for (let i = 1; i < shapes.length; i++) {
    const common = new oc.BRepAlgoAPI_Common_3(result, shapes[i], new oc.Message_ProgressRange_1());
    common.Build(new oc.Message_ProgressRange_1());
    result = common.Shape();
  }
  
  sceneShapes.push(result);
  return result;
}

function Translate(offset, shapes) {
  if (!oc || !Array.isArray(offset) || offset.length !== 3) return shapes;
  
  const tf = new oc.gp_Trsf_1();
  tf.SetTranslation_1(new oc.gp_Vec_4(offset[0], offset[1], offset[2]));
  const loc = new oc.TopLoc_Location_2(tf);
  
  return shapes.map(shape => shape.Moved(loc, false));
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
  
  return shapes.map(shape => shape.Moved(loc, false));
}

// 基本的な形状→メッシュ変換（シンプル版）
function ShapeToMesh(shape, deflection = 0.1) {
  if (!oc || !shape) return null;
  
  try {
    // メッシュ化
    new oc.BRepMesh_IncrementalMesh_2(shape, deflection, false, 0.5, false);
    
    const vertices = [];
    const normals = [];
    const indices = [];
    let vertexIndex = 0;
    
    // フェース探索
    const explorer = new oc.TopExp_Explorer_2(shape, oc.TopAbs_ShapeEnum.TopAbs_FACE, oc.TopAbs_ShapeEnum.TopAbs_SHAPE);
    
    while (explorer.More()) {
      const face = oc.TopoDS.Face_1(explorer.Current());
      
      // 三角形メッシュの取得
      const location = new oc.TopLoc_Location_1();
      const triangulation = oc.BRep_Tool.Triangulation(face, location);
      
      if (!triangulation.IsNull()) {
        const nodeCount = triangulation.NbNodes();
        const triangleCount = triangulation.NbTriangles();
        const transform = location.Transformation();
        
        // 頂点とインデックスの抽出
        const startVertexIndex = vertexIndex;
        
        for (let i = 1; i <= nodeCount; i++) {
          const node = triangulation.Node(i);
          // 変形を適用
          const transformedPnt = node.Transformed(transform);
          vertices.push(transformedPnt.X(), transformedPnt.Y(), transformedPnt.Z());
          normals.push(0, 0, 1); // 簡略化された法線（後で改善予定）
          vertexIndex++;
        }
        
        for (let i = 1; i <= triangleCount; i++) {
          const triangle = triangulation.Triangle(i);
          let n1 = triangle.Value(1);
          let n2 = triangle.Value(2);
          let n3 = triangle.Value(3);
          
          // フェースの向きに応じてインデックスの順序を調整
          if (face.Orientation_1() === oc.TopAbs_Orientation.TopAbs_REVERSED) {
            indices.push(
              startVertexIndex + n1 - 1,
              startVertexIndex + n3 - 1,
              startVertexIndex + n2 - 1
            );
          } else {
            indices.push(
              startVertexIndex + n1 - 1,
              startVertexIndex + n2 - 1,
              startVertexIndex + n3 - 1
            );
          }
        }
      }
      
      explorer.Next();
    }
    
    return {
      vertices: new Float32Array(vertices),
      normals: new Float32Array(normals),
      indices: new Uint16Array(indices)
    };
  } catch (error) {
    console.error("Error in ShapeToMesh:", error);
    return null;
  }
}

// メッセージハンドラーの実装
messageHandlers["Evaluate"] = function(payload) {
  try {
    opNumber = 0;
    GUIState = payload.GUIState || {};
    sceneShapes = []; // シーン形状をクリア
    
    postMessage({ type: "log", payload: "Evaluating CAD code..." });
    
    // コードの評価
    const func = new Function(`
      ${payload.code}
    `);
    
    func();
    
    postMessage({ type: "log", payload: `Evaluation completed. Generated ${sceneShapes.length} shapes.` });
    postMessage({ type: "resetWorking" });
    return { success: true, shapeCount: sceneShapes.length };
  } catch (e) {
    console.error("Evaluation error:", e);
    postMessage({ type: "resetWorking" });
    throw e;
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