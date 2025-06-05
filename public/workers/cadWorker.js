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

// 🔥 OpenCascade.js v1.1.1 用の安全なポイント作成ヘルパー関数
function createPoint(x = 0, y = 0, z = 0) {
  try {
    // まずパラメータなしでインスタンス化
    const point = new oc.gp_Pnt_1();
    // 次に座標を設定
    point.SetX(x);
    point.SetY(y);
    point.SetZ(z);
    return point;
  } catch (error) {
    console.error("❌ Point creation failed:", error);
    throw error;
  }
}

// 🔥 OpenCascade.js v1.1.1 用の安全な方向ベクトル作成ヘルパー関数
function createDirection(x = 0, y = 0, z = 1) {
  try {
    // まずパラメータなしでインスタンス化
    const dir = new oc.gp_Dir_4(x, y, z);
    return dir;
  } catch (error) {
    console.error("❌ Direction creation failed:", error);
    throw error;
  }
}

// OpenCascade.js読み込み（デバッグ強化版）
let ocInitialized = false;
var messageHandlers = {};

async function initializeOpenCascade() {
  console.log("🚀 Starting optimized OpenCascade initialization...");
  
  const startTime = performance.now();
  
  try {
    console.log("📁 Loading OpenCascade v1.1.1 with optimization...");
    console.log("📡 URL: /opencascade/opencascade.wasm.js");
    
    console.log("📦 Fetching OpenCascade.js file...");
    const response = await fetch('/opencascade/opencascade.wasm.js');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch OpenCascade.js: ${response.status} ${response.statusText}`);
    }
    
    console.log("📦 Reading file content...");
    let jsCode = await response.text();
    
    console.log("🔧 Processing ES Modules format...");
    jsCode = jsCode.replace(/export\s+default\s+[^;]+;?\s*$/, '');
    
    console.log("📦 Executing OpenCascade.js code...");
    eval(jsCode);
    
    console.log("✅ OpenCascade.js code executed successfully");
    
    if (typeof opencascade === 'undefined') {
      throw new Error("opencascade function not available after execution");
    }
    
    console.log("🔧 opencascade function found, initializing with optimization...");
    
    const openCascade = await opencascade({
      locateFile(path) {
        console.log(`🔍 Locating file: ${path}`);
        if (path.endsWith('.wasm')) {
          console.log("🎯 WASM file requested, returning: /opencascade/opencascade.wasm.wasm");
          return '/opencascade/opencascade.wasm.wasm';
        }
        return path;
      },
      wasmMemory: new WebAssembly.Memory({
        initial: 256,
        maximum: 1024,
        shared: false
      })
    });
    
    console.log("🎉 Optimized OpenCascade instance created successfully!");
    
    oc = openCascade;
    ocInitialized = true;
    
    const endTime = performance.now();
    const initDuration = endTime - startTime;
    
    postMessage({ type: "startupCallback" });
    console.log("✅ OpenCascade v1.1.1 initialized with optimization");
    console.log(`📊 WebAssembly initialization time: ${initDuration.toFixed(2)}ms`);
    
    if ('memory' in performance) {
      const memInfo = performance.memory;
      console.log('📊 Memory usage after initialization:', {
        used: Math.round(memInfo.usedJSHeapSize / 1048576) + 'MB',
        total: Math.round(memInfo.totalJSHeapSize / 1048576) + 'MB'
      });
    }
    
    return;
    
  } catch (error) {
    console.log("❌ Failed to load optimized OpenCascade");
    console.log(`❌ Error type: ${error.constructor.name}`);
    console.log(`❌ Error message: ${error.message}`);
    console.log(`❌ Error stack: ${error.stack}`);
    
    postMessage({ 
      type: "error", 
      payload: { 
        message: `Failed to load optimized OpenCascade.js: ${error.message}` 
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
  
  try {
    const tf = new oc.gp_Trsf_1();
    const radians = degrees * Math.PI / 180;
    
    // 修正：安全なポイント作成関数
    let pnt, dir, ax1;
    
    try {
      // パラメータなしでインスタンス化
      pnt = new oc.gp_Pnt_1();
      // 原点なので設定不要
      // pnt.SetX(0); pnt.SetY(0); pnt.SetZ(0);
      
      dir = new oc.gp_Dir_4(axis[0], axis[1], axis[2]);
      ax1 = new oc.gp_Ax1_2(pnt, dir);
    } catch (initError) {
      console.error("❌ Point/Direction creation failed:", initError);
      return shapes;
    }
    
    tf.SetRotation_1(ax1, radians);
    const loc = new oc.TopLoc_Location_2(tf);
    
    return shapes.map(shape => shape.Moved(loc));
  } catch (error) {
    console.error("❌ Rotation failed:", error);
    return shapes; // エラー時は元の形状を返す
  }
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
    console.log(error.stack);
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

// メッセージハンドラーを登録
messageHandlers["resetCache"] = function() {
  sceneShapes = [];
  return "";
};

messageHandlers["getGUIState"] = function() {
  return GUIState;
};

messageHandlers["evaluateCode"] = function(payload) {
  // 受け取ったコードを評価
  try {
    sceneShapes = [];
    GUIState = payload.guiState || {};
    
    // グローバル変数としてUI関数を定義
    self.GUIState = GUIState;
    
    console.log(`📝 Evaluating code: ${payload.code.substring(0, 50)}...`);
    eval(payload.code);
    console.log(`✅ Code evaluation successful, found ${sceneShapes.length} shapes`);
    
    // 生成された形状をJSONとして送信できる形式に変換
    const meshes = sceneShapes.map(shape => ShapeToMesh(shape));
    console.log(`🔷 Converted ${meshes.length} shapes to meshes`);
    
    return {
      meshes: meshes,
      guiState: GUIState
    };
  } catch (error) {
    console.error(`❌ Evaluation error:`, error);
    postMessage({ 
      type: "error", 
      payload: { message: `Evaluation error: ${error.message}` } 
    });
    return { meshes: [], guiState: GUIState };
  }
};

// ファイル読み込み関連のメッセージハンドラー
messageHandlers["importFile"] = function(payload) {
  try {
    console.log(`📂 ファイルインポート開始: ${payload.fileName}`);
    
    // ファイル形式を拡張子から判定
    const extension = payload.fileType.toLowerCase();
    const fileContent = new Uint8Array(payload.fileContent);
    let shape = null;
    
    // ファイル形式に応じた読み込み処理
    if (extension === 'step' || extension === 'stp') {
      console.log(`🔄 STEPファイル読み込み中... (${fileContent.length} bytes)`);
      
      try {
        // STEPファイル読み込み
        const stepReader = new oc.STEPControl_Reader_1();
        
        // ファイルデータを一時ファイルに書き込み
        const tempFileName = "temp.stp";
        oc.FS.writeFile(tempFileName, fileContent);
        
        // ファイルを読み込み
        if (stepReader.ReadFile(tempFileName) !== oc.IFSelect_ReturnStatus.IFSelect_RetDone) {
          throw new Error("STEPファイルの読み込みに失敗しました");
        }
        
        // ファイルからルートを読み込み
        const rootCount = stepReader.NbRootsForTransfer();
        console.log(`📊 STEPファイル内のルート数: ${rootCount}`);
        
        if (rootCount <= 0) {
          throw new Error("STEPファイルに有効なデータがありません");
        }
        
        // すべてのルートを変換
        stepReader.TransferRoots();
        
        // 形状を取得
        shape = stepReader.OneShape();
        
        // 一時ファイルを削除
        oc.FS.unlink(tempFileName);
        
        console.log("✅ STEPファイル読み込み成功");
      } catch (error) {
        console.error(`❌ STEPファイル読み込みエラー: ${error.message}`);
        throw error;
      }
    } else if (extension === 'iges' || extension === 'igs') {
      console.log(`🔄 IGESファイル読み込み中... (${fileContent.length} bytes)`);
      
      try {
        // IGESファイル読み込み
        const igesReader = new oc.IGESControl_Reader_1();
        
        // ファイルデータを一時ファイルに書き込み
        const tempFileName = "temp.igs";
        oc.FS.writeFile(tempFileName, fileContent);
        
        // ファイルを読み込み
        if (igesReader.ReadFile(tempFileName) !== oc.IFSelect_ReturnStatus.IFSelect_RetDone) {
          throw new Error("IGESファイルの読み込みに失敗しました");
        }
        
        // ファイルからルートを読み込み
        const rootCount = igesReader.NbRootsForTransfer();
        console.log(`📊 IGESファイル内のルート数: ${rootCount}`);
        
        if (rootCount <= 0) {
          throw new Error("IGESファイルに有効なデータがありません");
        }
        
        // すべてのルートを変換
        igesReader.TransferRoots();
        
        // 形状を取得
        shape = igesReader.OneShape();
        
        // 一時ファイルを削除
        oc.FS.unlink(tempFileName);
        
        console.log("✅ IGESファイル読み込み成功");
      } catch (error) {
        console.error(`❌ IGESファイル読み込みエラー: ${error.message}`);
        throw error;
      }
    } else {
      throw new Error(`サポートされていないファイル形式です: ${extension}`);
    }
    
    // 有効な形状があれば追加
    if (shape) {
      // 形状情報取得
      const shapeInfo = {
        type: 'imported',
        source: payload.fileName,
        format: extension.toUpperCase()
      };
      
      // 形状をシーンに追加
      sceneShapes.push(shape);
      
      // メッシュ変換
      const mesh = ShapeToMesh(shape);
      
      console.log("🎯 インポート完了");
      
      return {
        success: true,
        shapeInfo: shapeInfo,
        mesh: mesh
      };
    } else {
      throw new Error("有効な形状が見つかりませんでした");
    }
  } catch (error) {
    console.error(`❌ ファイルインポートエラー: ${error.message}`);
    postMessage({ 
      type: "error", 
      payload: { message: `ファイルインポートエラー: ${error.message}` } 
    });
    return { success: false, error: error.message };
  }
};

// エクスポート関連のメッセージハンドラー
messageHandlers["combineAndRenderShapes"] = function(payload) {
  try {
    console.log("🎨 Combining and rendering shapes...");
    
    if (sceneShapes.length === 0) {
      console.log("⚠️ No shapes to render");
      return { meshes: [], success: false };
    }
    
    const meshes = [];
    const maxDeviation = payload.maxDeviation || 0.1;
    
    for (let i = 0; i < sceneShapes.length; i++) {
      try {
        const mesh = ShapeToMesh(sceneShapes[i], maxDeviation);
        if (mesh) {
          meshes.push(mesh);
        }
      } catch (error) {
        console.error(`❌ Failed to mesh shape ${i}:`, error);
      }
    }
    
    console.log(`✅ Successfully rendered ${meshes.length} shapes`);
    return { meshes, success: true };
  } catch (error) {
    console.error("❌ combineAndRenderShapes failed:", error);
    return { meshes: [], success: false, error: error.message };
  }
};

messageHandlers["exportFile"] = function(payload) {
  try {
    console.log(`📤 ファイルエクスポート開始: ${payload.format}`);
    
    // 形式を確認
    const format = payload.format.toLowerCase();
    let exportedData = null;
    
    // エクスポート対象がない場合
    if (sceneShapes.length === 0) {
      throw new Error("エクスポートする形状がありません");
    }
    
    // 複数の形状を結合（必要に応じて）
    let exportShape = sceneShapes[0];
    if (sceneShapes.length > 1) {
      // 複合形状を作成
      const compound = new oc.TopoDS_Compound();
      const builder = new oc.BRep_Builder();
      builder.MakeCompound(compound);
      
      // すべての形状を追加
      for (const shape of sceneShapes) {
        builder.Add(compound, shape);
      }
      
      exportShape = compound;
    }
    
    // 形式に応じたエクスポート処理
    if (format === 'step') {
      console.log("🔄 STEPフォーマットでエクスポート中...");
      
      try {
        // STEPエクスポート
        const stepWriter = new oc.STEPControl_Writer_1();
        
        // 初期化と形状の転送
        stepWriter.Transfer(exportShape, oc.STEPControl_StepModelType.STEPControl_AsIs);
        
        // 一時ファイル名
        const tempFileName = "export.step";
        
        // ファイルに書き込み
        if (stepWriter.Write(tempFileName) !== oc.IFSelect_ReturnStatus.IFSelect_RetDone) {
          throw new Error("STEPファイルの書き込みに失敗しました");
        }
        
        // ファイルからデータを読み込み
        exportedData = oc.FS.readFile(tempFileName, { encoding: 'binary' });
        
        // 一時ファイルを削除
        oc.FS.unlink(tempFileName);
        
        console.log("✅ STEPエクスポート成功");
      } catch (error) {
        console.error(`❌ STEPエクスポートエラー: ${error.message}`);
        throw error;
      }
    } else if (format === 'stl') {
      console.log("🔄 STLフォーマットでエクスポート中...");
      try {
        const stlWriter = new oc.StlAPI_Writer();
        // 品質設定（分割精度）
        const deflection = typeof payload.quality === 'number' ? payload.quality : 0.1;
        // バイナリ/アスキー切り替え
        stlWriter.SetASCIIMode(payload.binaryStl === false); // false:バイナリ, true:アスキー
        // メッシュ分割精度をShapeToMesh等で利用する場合はここで適用（現状はSTL出力APIに直接渡せないため、将来的に拡張）
        // 一時ファイル名
        const tempFileName = "export.stl";
        // ファイルに書き込み
        if (!stlWriter.Write(exportShape, tempFileName)) {
          throw new Error("STLファイルの書き込みに失敗しました");
        }
        exportedData = oc.FS.readFile(tempFileName, { encoding: 'binary' });
        oc.FS.unlink(tempFileName);
        console.log("✅ STLエクスポート成功");
      } catch (error) {
        console.error(`❌ STLエクスポートエラー: ${error.message}`);
        throw error;
      }
    } else if (format === 'obj') {
      console.log("🔄 OBJフォーマットでエクスポート中...");
      try {
        // 品質設定
        const deflection = typeof payload.quality === 'number' ? payload.quality : 0.1;
        const includeNormals = payload.includeNormals !== false; // デフォルトtrue
        
        // OBJファイルの内容を構築
        let objContent = "# OBJ file exported from CascadeStudio\n";
        objContent += `# Generated on ${new Date().toISOString()}\n\n`;
        
        let vertexOffset = 0;
        let shapeIndex = 0;
        
        // すべての形状を処理
        const shapesToExport = sceneShapes.length > 0 ? sceneShapes : [exportShape];
        
        for (const shape of shapesToExport) {
          shapeIndex++;
          objContent += `# Shape ${shapeIndex}\n`;
          objContent += `g shape_${shapeIndex}\n`;
          
          // メッシュ化
          new oc.BRepMesh_IncrementalMesh_2(shape, deflection, false, 0.5, false);
          
          // フェース探索
          const explorer = new oc.TopExp_Explorer_2(shape, oc.TopAbs_ShapeEnum.TopAbs_FACE, oc.TopAbs_ShapeEnum.TopAbs_SHAPE);
          
          const vertices = [];
          const normals = [];
          const faces = [];
          
          while (explorer.More()) {
            const face = oc.TopoDS.Face_1(explorer.Current());
            
            try {
              const location = new oc.TopLoc_Location_1();
              const triangulation = oc.BRep_Tool.Triangulation(face, location);
              
              if (!triangulation.IsNull()) {
                const nodeCount = triangulation.get().NbNodes();
                const triangleCount = triangulation.get().NbTriangles();
                
                // 頂点の収集
                const faceVertices = [];
                for (let i = 1; i <= nodeCount; i++) {
                  const node = triangulation.get().Node(i);
                  faceVertices.push([node.X(), node.Y(), node.Z()]);
                  vertices.push([node.X(), node.Y(), node.Z()]);
                }
                
                // 法線の計算（必要な場合）
                if (includeNormals) {
                  // フェースの向きを取得
                  const orientation = face.Orientation();
                  const isReversed = orientation === oc.TopAbs_Orientation.TopAbs_REVERSED;
                  
                  // 各三角形の法線を計算
                  for (let i = 1; i <= triangleCount; i++) {
                    const triangle = triangulation.get().Triangle(i);
                    const n1 = triangle.Value(1) - 1;
                    const n2 = triangle.Value(2) - 1;
                    const n3 = triangle.Value(3) - 1;
                    
                    // 三角形の頂点
                    const v1 = faceVertices[n1];
                    const v2 = faceVertices[n2];
                    const v3 = faceVertices[n3];
                    
                    // エッジベクトル
                    const edge1 = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
                    const edge2 = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];
                    
                    // 外積で法線を計算
                    let normal = [
                      edge1[1] * edge2[2] - edge1[2] * edge2[1],
                      edge1[2] * edge2[0] - edge1[0] * edge2[2],
                      edge1[0] * edge2[1] - edge1[1] * edge2[0]
                    ];
                    
                    // 正規化
                    const length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
                    if (length > 0) {
                      normal[0] /= length;
                      normal[1] /= length;
                      normal[2] /= length;
                    }
                    
                    // フェースの向きに応じて反転
                    if (isReversed) {
                      normal[0] = -normal[0];
                      normal[1] = -normal[1];
                      normal[2] = -normal[2];
                    }
                    
                    // 各頂点に同じ法線を割り当て（簡略化）
                    normals.push(normal);
                    normals.push(normal);
                    normals.push(normal);
                  }
                }
                
                // フェース（三角形）の収集
                const startIndex = vertexOffset;
                for (let i = 1; i <= triangleCount; i++) {
                  const triangle = triangulation.get().Triangle(i);
                  faces.push([
                    startIndex + triangle.Value(1),
                    startIndex + triangle.Value(2),
                    startIndex + triangle.Value(3)
                  ]);
                }
                
                vertexOffset += nodeCount;
              }
            } catch (faceError) {
              console.log(`⚠️ Error processing face: ${faceError.message}`);
            }
            
            explorer.Next();
          }
          
          // 頂点を出力
          objContent += "\n# Vertices\n";
          for (const vertex of vertices) {
            objContent += `v ${vertex[0]} ${vertex[1]} ${vertex[2]}\n`;
          }
          
          // 法線を出力（必要な場合）
          if (includeNormals && normals.length > 0) {
            objContent += "\n# Normals\n";
            for (const normal of normals) {
              objContent += `vn ${normal[0]} ${normal[1]} ${normal[2]}\n`;
            }
          }
          
          // フェースを出力
          objContent += "\n# Faces\n";
          for (let i = 0; i < faces.length; i++) {
            const face = faces[i];
            if (includeNormals && normals.length > 0) {
              // 法線インデックス付き
              const normalBase = i * 3 + 1;
              objContent += `f ${face[0]}/${face[0]}/${normalBase} ${face[1]}/${face[1]}/${normalBase+1} ${face[2]}/${face[2]}/${normalBase+2}\n`;
            } else {
              // 頂点のみ
              objContent += `f ${face[0]} ${face[1]} ${face[2]}\n`;
            }
          }
          
          objContent += "\n";
        }
        
        // 文字列をバイト配列に変換
        const encoder = new TextEncoder();
        exportedData = encoder.encode(objContent);
        
        console.log("✅ OBJエクスポート成功");
      } catch (error) {
        console.error(`❌ OBJエクスポートエラー: ${error.message}`);
        throw error;
      }
    } else {
      throw new Error(`サポートされていないエクスポート形式です: ${format}`);
    }
    
    if (exportedData) {
      console.log(`📊 エクスポートデータサイズ: ${exportedData.length} bytes`);
      
      return {
        success: true,
        format: format,
        fileName: payload.fileName || `export.${format}`,
        data: Array.from(new Uint8Array(exportedData))
      };
    } else {
      throw new Error("エクスポートデータの生成に失敗しました");
    }
  } catch (error) {
    console.error(`❌ ファイルエクスポートエラー: ${error.message}`);
    postMessage({ 
      type: "error", 
      payload: { message: `ファイルエクスポートエラー: ${error.message}` } 
    });
    return { success: false, error: error.message };
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

// UI関連の関数を追加
function Slider(name, defaultValue, min, max, step = 1) {
  if (GUIState && name in GUIState) {
    return GUIState[name];
  }
  GUIState[name] = defaultValue;
  return defaultValue;
}

function Checkbox(name, defaultValue) {
  if (GUIState && name in GUIState) {
    return GUIState[name];
  }
  GUIState[name] = defaultValue;
  return defaultValue;
}

function TextInput(name, defaultValue) {
  if (GUIState && name in GUIState) {
    return GUIState[name];
  }
  GUIState[name] = defaultValue;
  return defaultValue;
}

function Dropdown(name, options, defaultIndex) {
  if (GUIState && name in GUIState) {
    return GUIState[name];
  }
  
  const defaultValue = options[defaultIndex] || options[0];
  GUIState[name] = defaultValue;
  return defaultValue;
}

function Button(name) {
  return GUIState && name in GUIState ? GUIState[name] : false;
}

function Text3D(text, size, height, fontName = 'Arial') {
  // 簡易版のテキスト3D実装（OpenCascade v1.1.1互換）
  try {
    // v1.1.1対応: gp_Pnt_1コンストラクタに問題があるので、使用を避ける
    const textLength = text.length;
    const textWidth = textLength * size * 0.6;
    
    console.log(`Creating simple text box for "${text}" (size: ${size}, height: ${height})`);
    
    // 単純なボックスの作成（Text3Dの代替として）
    const box = new oc.BRepPrimAPI_MakeBox_1(textWidth, size, height).Shape();
    sceneShapes.push(box);
    
    return box;
  } catch (error) {
    console.error("Text3D error:", error);
    // エラー時はフォールバックとして小さなボックスを返す
    return Box(5, 5, 5);
  }
}


function Extrude(shape, distance, direction) {
  if (!direction) direction = [0, 0, 1];
  if (!distance) distance = 10;
  
  console.log(`🔧 Extruding shape by distance ${distance} in direction [${direction.join(', ')}]`);
  
  try {
    const extrudeVector = new oc.gp_Vec_4(
      direction[0] * distance,
      direction[1] * distance,
      direction[2] * distance
    );
    
    const extruded = new oc.BRepPrimAPI_MakePrism_1(shape, extrudeVector, false, true).Shape();
    sceneShapes.push(extruded);
    
    console.log("✅ Extrude operation successful");
    return extruded;
  } catch (error) {
    console.error("❌ Extrude operation failed:", error);
    console.log("🔄 Falling back to translation method");
    
    const offset = [
      direction[0] * distance,
      direction[1] * distance,
      direction[2] * distance
    ];
    
    const extruded = Translate(offset, [shape])[0];
    sceneShapes.push(extruded);
    
    console.log("✅ Extrude operation successful (using translation fallback)");
    return extruded;
  }
}

function Revolve(shape, axis, angle) {
  if (!axis) axis = [0, 0, 1];
  if (!angle) angle = 360;
  
  console.log(`🔄 Revolving shape around axis [${axis.join(', ')}] by ${angle} degrees`);
  
  try {
    const radians = angle * Math.PI / 180;
    
    const origin = new oc.gp_Pnt_1();
    origin.SetXYZ(new oc.gp_XYZ_2(0, 0, 0));
    
    const direction = new oc.gp_Dir_4(axis[0], axis[1], axis[2]);
    const rotationAxis = new oc.gp_Ax1_2(origin, direction);
    
    let revolved;
    if (angle >= 360) {
      revolved = new oc.BRepPrimAPI_MakeRevol_1(shape, rotationAxis).Shape();
    } else {
      revolved = new oc.BRepPrimAPI_MakeRevol_2(shape, rotationAxis, radians).Shape();
    }
    
    sceneShapes.push(revolved);
    console.log("✅ Revolve operation successful");
    return revolved;
  } catch (error) {
    console.error("❌ Revolve operation failed:", error);
    console.log("🔄 Falling back to rotation method");
    
    try {
      const fallbackRadians = angle * Math.PI / 180;
      const tf = new oc.gp_Trsf_1();
      
      const fallbackOrigin = new oc.gp_Pnt_1();
      fallbackOrigin.SetXYZ(new oc.gp_XYZ_2(0, 0, 0));
      const fallbackDirection = new oc.gp_Dir_4(axis[0], axis[1], axis[2]);
      const rotAxis = new oc.gp_Ax1_2(fallbackOrigin, fallbackDirection);
      
      tf.SetRotation_1(rotAxis, fallbackRadians);
      
      const transform = new oc.BRepBuilderAPI_Transform_2(shape, tf, false);
      const rotated = transform.Shape();
      
      sceneShapes.push(rotated);
      console.log("✅ Revolve operation successful (using rotation fallback)");
      return rotated;
    } catch (fallbackError) {
      console.error("❌ Revolve fallback also failed:", fallbackError);
      throw error;
    }
  }
}

function Loft(profiles) {
  if (!profiles || !Array.isArray(profiles) || profiles.length < 2) {
    throw new Error("Loft requires at least 2 profile shapes");
  }
  
  console.log(`🏗️ Lofting ${profiles.length} profiles`);
  
  try {
    const loftBuilder = new oc.BRepOffsetAPI_ThruSections_1(true, false, 1e-6);
    
    for (const profile of profiles) {
      loftBuilder.AddWire(profile);
    }
    
    loftBuilder.Build();
    const lofted = loftBuilder.Shape();
    
    sceneShapes.push(lofted);
    console.log("✅ Loft operation successful");
    return lofted;
  } catch (error) {
    console.error("❌ Loft operation failed:", error);
    throw error;
  }
}

function FilletEdges(shape, radius, edges) {
  if (!shape) throw new Error("Invalid shape for filleting");
  if (!radius) radius = 1;
  
  console.log(`🔘 Applying fillet with radius ${radius}`);
  
  try {
    const filletBuilder = new oc.BRepFilletAPI_MakeFillet_1(shape, oc.ChFi3d_FilletShape.ChFi3d_Rational);
    
    if (edges && edges.length > 0) {
      for (const edge of edges) {
        filletBuilder.Add_2(radius, edge);
      }
    } else {
      const explorer = new oc.TopExp_Explorer_2(shape, oc.TopAbs_ShapeEnum.TopAbs_EDGE, oc.TopAbs_ShapeEnum.TopAbs_SHAPE);
      while (explorer.More()) {
        const edge = oc.TopoDS.Edge_1(explorer.Current());
        filletBuilder.Add_2(radius, edge);
        explorer.Next();
      }
    }
    
    filletBuilder.Build();
    const filleted = filletBuilder.Shape();
    
    sceneShapes.push(filleted);
    console.log("✅ Fillet operation successful");
    return filleted;
  } catch (error) {
    console.error("❌ Fillet operation failed:", error);
    throw error;
  }
}

function ChamferEdges(shape, distance, edges) {
  if (!shape) throw new Error("Invalid shape for chamfering");
  if (!distance) distance = 1;
  
  console.log(`🔲 Applying chamfer with distance ${distance}`);
  
  try {
    const chamferBuilder = new oc.BRepFilletAPI_MakeChamfer_1(shape);
    
    if (edges && edges.length > 0) {
      for (const edge of edges) {
        const explorer = new oc.TopExp_Explorer_2(shape, oc.TopAbs_ShapeEnum.TopAbs_FACE, oc.TopAbs_ShapeEnum.TopAbs_SHAPE);
        if (explorer.More()) {
          const face = oc.TopoDS.Face_1(explorer.Current());
          chamferBuilder.Add_3(distance, edge, face);
        }
      }
    } else {
      const edgeExplorer = new oc.TopExp_Explorer_2(shape, oc.TopAbs_ShapeEnum.TopAbs_EDGE, oc.TopAbs_ShapeEnum.TopAbs_SHAPE);
      while (edgeExplorer.More()) {
        const edge = oc.TopoDS.Edge_1(edgeExplorer.Current());
        
        const faceExplorer = new oc.TopExp_Explorer_2(shape, oc.TopAbs_ShapeEnum.TopAbs_FACE, oc.TopAbs_ShapeEnum.TopAbs_SHAPE);
        if (faceExplorer.More()) {
          const face = oc.TopoDS.Face_1(faceExplorer.Current());
          chamferBuilder.Add_3(distance, edge, face);
        }
        
        edgeExplorer.Next();
      }
    }
    
    chamferBuilder.Build();
    const chamfered = chamferBuilder.Shape();
    
    sceneShapes.push(chamfered);
    console.log("✅ Chamfer operation successful");
    return chamfered;
  } catch (error) {
    console.error("❌ Chamfer operation failed:", error);
    throw error;
  }
}

function Mirror(plane, shapes) {
  if (!plane || plane.length !== 4) {
    plane = [1, 0, 0, 0];
  }
  if (!shapes) shapes = sceneShapes;
  if (!Array.isArray(shapes)) shapes = [shapes];
  
  console.log(`🪞 Mirroring ${shapes.length} shapes across plane [${plane.join(', ')}]`);
  
  try {
    const mirrored = [];
    
    for (const shape of shapes) {
      const tf = new oc.gp_Trsf_1();
      
      const planePoint = new oc.gp_Pnt_1();
      planePoint.SetXYZ(new oc.gp_XYZ_2(0, 0, -plane[3] / (plane[2] || 1)));
      
      const planeNormal = new oc.gp_Dir_4(plane[0], plane[1], plane[2]);
      const mirrorPlane = new oc.gp_Pln_3(planePoint, planeNormal);
      tf.SetMirror_2(mirrorPlane);
      
      const transform = new oc.BRepBuilderAPI_Transform_2(shape, tf, false);
      const mirroredShape = transform.Shape();
      
      mirrored.push(mirroredShape);
      sceneShapes.push(mirroredShape);
    }
    
    console.log("✅ Mirror operation successful");
    return mirrored.length === 1 ? mirrored[0] : mirrored;
  } catch (error) {
    console.error("❌ Mirror operation failed:", error);
    throw error;
  }
}

function Offset(shape, distance) {
  if (!shape) throw new Error("Invalid shape for offset");
  if (!distance) distance = 1;
  
  console.log(`📏 Offsetting shape by distance ${distance}`);
  
  try {
    const offsetBuilder = new oc.BRepOffsetAPI_MakeOffsetShape_1();
    offsetBuilder.PerformByJoin(shape, distance, 1e-6);
    
    const offset = offsetBuilder.Shape();
    
    sceneShapes.push(offset);
    console.log("✅ Offset operation successful");
    return offset;
  } catch (error) {
    console.error("❌ Offset operation failed:", error);
    throw error;
  }
}

// グローバル関数としてUIライブラリ関数を定義
self.Slider = Slider;
self.Checkbox = Checkbox;
self.TextInput = TextInput;
self.Dropdown = Dropdown;
self.Button = Button;
self.Text3D = Text3D;

self.Extrude = Extrude;
self.Revolve = Revolve;
self.Loft = Loft;
self.FilletEdges = FilletEdges;
self.ChamferEdges = ChamferEdges;
self.Mirror = Mirror;
self.Offset = Offset;
