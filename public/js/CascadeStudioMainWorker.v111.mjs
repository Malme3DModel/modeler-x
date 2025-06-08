// Phase 2: OpenCascade.js v1.1.1専用ESM WebWorker
// v1.1.1の新しい初期化方法を使用

// OpenCascade.js v1.1.1のESMインポート（WebWorker用ローカルパス）
import opencascade from '/js/libs/opencascade.wasm.js';

console.log("=== v1.1.1 ESM Worker Starting ===");

// Define the persistent global variables
var oc = null, externalShapes = {}, sceneShapes = [],
  GUIState, fullShapeEdgeHashes = {}, fullShapeFaceHashes = {},
  currentShape;
var argCache = {}, usedHashes = {}, opNumber = 0, currentOp = '', currentLineNumber = 0;

// Capture Logs and Errors and forward them to the main thread
let realConsoleLog   = console.log;
let realConsoleError = console.error;
console.log = function (message) {
  setTimeout(() => { postMessage({ type: "log", payload: message }); }, 0);
  realConsoleLog.apply(console, arguments);
};
console.error = function (err, url, line, colno, errorObj) {
  postMessage({ type: "resetWorking" });
  setTimeout(() => {
    err.message = "INTERNAL OPENCASCADE ERROR DURING GENERATE: " + err.message;
    throw err; 
  }, 0);
  
  realConsoleError.apply(console, arguments);
};

// ESM対応のダイナミックインポート関数
async function loadDependencies() {
  try {
    console.log("Loading dependencies using fetch and eval for ESM compatibility...");
    
    // ESMモジュールではimportScriptsが使えないため、fetchとevalを使用
    const scripts = [
      '/js/CascadeStudioStandardUtils.js',
      '/js/CascadeStudioStandardLibrary.js', 
      '/js/CascadeStudioShapeToMesh.js',
      '/js/opentype.js/dist/opentype.min.js'
    ];
    
    for (const script of scripts) {
      console.log(`Loading script: ${script}`);
      await loadScriptWithFetch(script);
      console.log(`Successfully loaded: ${script}`);
    }
    
    console.log("All dependencies loaded successfully for v1.1.1");
    return true;
  } catch (error) {
    console.error("Failed to load dependencies for v1.1.1:", error);
    postMessage({ type: "error", payload: `Dependency loading failed: ${error.message}` });
    return false;
  }
}

// ESM対応のスクリプト読み込み関数
async function loadScriptWithFetch(src) {
  try {
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const scriptText = await response.text();
    
    // グローバルスコープでevalを実行
    eval(scriptText);
    
    // 重要な関数が読み込まれたかチェック（非ブロッキング）
    if (src.includes('StandardLibrary')) {
      console.log(`StandardLibrary loaded - functions will be available in global scope`);
      // 関数の可用性を確認（エラーにはしない）
      setTimeout(() => {
        console.log(`Function availability check: ForEachEdge=${typeof ForEachEdge}, ForEachFace=${typeof ForEachFace}`);
      }, 10);
    }
    
  } catch (error) {
    console.error(`Failed to load script ${src}:`, error);
    throw error;
  }
}

// Vector3の代替実装（Phase 1から継承）
function Vector3(x, y, z) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
}

Vector3.prototype.set = function(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
  return this;
};

Vector3.prototype.copy = function(v) {
  this.x = v.x;
  this.y = v.y;
  this.z = v.z;
  return this;
};

Vector3.prototype.distanceTo = function(v) {
  const dx = this.x - v.x;
  const dy = this.y - v.y;
  const dz = this.z - v.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

Vector3.prototype.normalize = function() {
  const length = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  if (length > 0) {
    this.x /= length;
    this.y /= length;
    this.z /= length;
  }
  return this;
};

Vector3.prototype.clone = function() {
  return new Vector3(this.x, this.y, this.z);
};

const THREE = {
  Vector3: Vector3
};

// フォント読み込み機能（既存から継承）
var preloadedFonts = ['/fonts/Roboto.ttf',
  '/fonts/Papyrus.ttf', '/fonts/Consolas.ttf'];
var fonts = {};
var fontsLoaded = false;
var fontLoadingPromise = null;

async function loadFonts() {
  if (fontLoadingPromise) {
    return fontLoadingPromise;
  }
  
  fontLoadingPromise = (async () => {
    console.log("Starting synchronous font loading...");
    console.log("opentype object:", typeof opentype);
    
    for (const fontURL of preloadedFonts) {
      try {
        console.log("Fetching font:", fontURL);
        const response = await fetch(fontURL);
        if (!response.ok) {
          console.log("Font fetch failed for", fontURL, ":", response.status);
          continue;
        }
        const arrayBuffer = await response.arrayBuffer();
        const font = opentype.parse(arrayBuffer);
        let fontName = fontURL.split("/fonts/")[1].split(".ttf")[0];
        fonts[fontName] = font;
        console.log("Successfully loaded font:", fontName);
      } catch (err) {
        console.log("Font loading error for", fontURL, ":", err);
      }
    }
    
    fontsLoaded = true;
    console.log("Font loading complete. Available fonts:", Object.keys(fonts));
  })();
  
  return fontLoadingPromise;
}

// OpenCascade.js v1.1.1初期化関数（公式推奨方法）
async function initializeOpenCascade() {
  try {
    console.log("=== OpenCascade.js v1.1.1 ESM Worker Initialization ===");
    
    // v1.1.1の正確な初期化方法（WebWorker用）
    oc = await new opencascade({
      locateFile(path) {
        if(path.endsWith('.wasm')) {
          return '/js/libs/opencascade.wasm.wasm';
        }
        return path;
      }
    });
    console.log('OpenCascade.js v1.1.1 initialized successfully');
    console.log('OpenCascade v1.1.1 API available:', typeof oc);
    
    // フォント読み込み
    await loadFonts();
    console.log('Fonts loaded for v1.1.1');
    
    // API調査
    investigateAPI();
    
    // 初期化完了通知
    postMessage({ type: "startupCallback" });
    
    return true;
  } catch (error) {
    console.error('Failed to initialize OpenCascade.js v1.1.1:', error);
    console.error('Error details:', error.stack);
    postMessage({ type: "error", payload: `v1.1.1 Worker failed: ${error.message}` });
    throw error;
  }
}

// Debug function to investigate v1.1.1 API
function investigateAPI() {
  console.log("=== OpenCascade.js v1.1.1 API Investigation ===");
  
  try {
    // Check if gp_Trsf exists and try different constructor patterns
    if (oc.gp_Trsf) {
      console.log("gp_Trsf class found, attempting constructor...");
      
      let trsf = null;
      try {
        // Try v1.1.1 constructor pattern
        trsf = new oc.gp_Trsf_1();
      } catch (e1) {
        try {
          // Try alternative constructor
          trsf = oc.gp_Trsf.prototype.constructor();
        } catch (e2) {
          try {
            // Try static method
            trsf = oc.gp_Trsf();
          } catch (e3) {
            console.log("All gp_Trsf constructor attempts failed, skipping detailed investigation");
            console.log("Constructor errors:", e1.message, e2.message, e3.message);
          }
        }
      }
      
      if (trsf) {
        console.log("gp_Trsf successfully created");
        const trsfMethods = Object.getOwnPropertyNames(oc.gp_Trsf.prototype);
        console.log("gp_Trsf methods available:", trsfMethods.length);
        
        // Send basic info to main thread
        postMessage({ 
          type: "apiInvestigation", 
          payload: {
            version: "v1.1.1",
            status: "success",
            methodCount: trsfMethods.length
          }
        });
      } else {
        console.log("Could not create gp_Trsf instance, but class exists");
        postMessage({ 
          type: "apiInvestigation", 
          payload: {
            version: "v1.1.1",
            status: "constructor_failed",
            classExists: true
          }
        });
      }
    } else {
      console.log("gp_Trsf class not found in v1.1.1 API");
      postMessage({ 
        type: "apiInvestigation", 
        payload: {
          version: "v1.1.1",
          status: "class_not_found"
        }
      });
    }
    
    // Test basic API availability
    console.log("Basic API check - BRepPrimAPI_MakeBox:", typeof oc.BRepPrimAPI_MakeBox);
    console.log("Basic API check - TopoDS_Shape:", typeof oc.TopoDS_Shape);
    
  } catch (error) {
    console.log("API investigation error:", error.message);
    postMessage({ 
      type: "apiInvestigation", 
      payload: {
        version: "v1.1.1",
        status: "error",
        error: error.message
      }
    });
  }
  
  console.log("=== End v1.1.1 API Investigation ===");
}

// メッセージハンドラー
var messageHandlers = {};

/** This function evaluates `payload.code` (the contents of the Editor Window)
 *  and sets the GUI State. */
function Evaluate(payload) {
  opNumber = 0; // This keeps track of the progress of the evaluation
  GUIState = payload.GUIState;
  try {
    eval(payload.code);
  } catch (e) {
    setTimeout(() => {
      e.message = "Line " + currentLineNumber + ": "  + currentOp + "() encountered  " + e.message;
      throw e;
    }, 0);
  } finally {
    postMessage({ type: "resetWorking" });
    // Clean Cache; remove unused Objects
    for (let hash in argCache) {
      if (!usedHashes.hasOwnProperty(hash)) { delete argCache[hash]; } }
    usedHashes = {};
  }
}
messageHandlers["Evaluate"] = Evaluate;

/**This function accumulates all the shapes in `sceneShapes` into the `TopoDS_Compound` `currentShape`
 * and converts it to a mesh (and a set of edges) with `ShapeToMesh()`, and sends it off to be rendered. */
function combineAndRenderShapes(payload) {
  // Initialize currentShape as an empty Compound Solid
  currentShape     = new oc.TopoDS_Compound();
  let sceneBuilder = new oc.BRep_Builder();
  sceneBuilder.MakeCompound(currentShape);
  let fullShapeEdgeHashes = {}; let fullShapeFaceHashes = {};
  postMessage({ "type": "Progress", "payload": { "opNumber": opNumber++, "opType": "Combining Shapes" } });

  // If there are sceneShapes, iterate through them and add them to currentShape
  if (sceneShapes.length > 0) {
    for (let shapeInd = 0; shapeInd < sceneShapes.length; shapeInd++) {
      if (!sceneShapes[shapeInd] || !sceneShapes[shapeInd].IsNull || sceneShapes[shapeInd].IsNull()) {
        console.error("Null Shape detected in sceneShapes; skipping: " + JSON.stringify(sceneShapes[shapeInd]));
        continue;
      }
      if (!sceneShapes[shapeInd].ShapeType) {
        console.error("Non-Shape detected in sceneShapes; " +
          "are you sure it is a TopoDS_Shape and not something else that needs to be converted to one?");
        console.error(JSON.stringify(sceneShapes[shapeInd]));
        continue;
      }

      // Scan the edges and faces and add to the edge list
      if (typeof ForEachEdge === 'function') {
        Object.assign(fullShapeEdgeHashes, ForEachEdge(sceneShapes[shapeInd], (index, edge) => { }));
      }
      if (typeof ForEachFace === 'function') {
        ForEachFace(sceneShapes[shapeInd], (index, face) => {
          fullShapeFaceHashes[face.HashCode(100000000)] = index;
        });
      }

      sceneBuilder.Add(currentShape, sceneShapes[shapeInd]);
    }

    // Use ShapeToMesh to output a set of triangulated faces and discretized edges to the 3D Viewport
    postMessage({ "type": "Progress", "payload": { "opNumber": opNumber++, "opType": "Triangulating Faces" } });
    let facesAndEdges = ShapeToMesh(currentShape,
      payload.maxDeviation||0.1, fullShapeEdgeHashes, fullShapeFaceHashes);
    sceneShapes = [];
    postMessage({ "type": "Progress", "payload": { "opNumber": opNumber, "opType": "" } }); // Finish the progress
    return [facesAndEdges, payload.sceneOptions];
  } else {
    console.error("There were no scene shapes returned!");
  }
  postMessage({ "type": "Progress", "payload": { "opNumber": opNumber, "opType": "" } });
}
messageHandlers["combineAndRenderShapes"] = combineAndRenderShapes;

// メインの初期化処理
async function main() {
  try {
    console.log("=== v1.1.1 ESM Worker Starting ===");
    
    // 依存関係の読み込み
    const dependenciesLoaded = await loadDependencies();
    if (!dependenciesLoaded) {
      throw new Error("Failed to load dependencies");
    }
    
    // OpenCascade.js v1.1.1初期化
    const ocInitialized = await initializeOpenCascade();
    if (!ocInitialized) {
      throw new Error("Failed to initialize OpenCascade.js v1.1.1");
    }
    
    // メッセージハンドラーの設定
    onmessage = function (e) {
      try {
        if (!messageHandlers[e.data.type]) {
          console.error(`Unknown message type: ${e.data.type}`);
          postMessage({ type: "error", payload: `Unknown message type: ${e.data.type}` });
          return;
        }
        
        let response = messageHandlers[e.data.type](e.data.payload);
        if (response) { 
          postMessage({ "type": e.data.type, payload: response }); 
        }
      } catch (error) {
        console.error(`Error handling message ${e.data.type}:`, error);
        postMessage({ type: "error", payload: `Message handler error: ${error.message}` });
        postMessage({ type: "resetWorking" });
      }
    };
    
    console.log("=== v1.1.1 ESM Worker Ready ===");
    
  } catch (error) {
    console.error("v1.1.1 ESM Worker initialization failed:", error);
    postMessage({ type: "error", payload: error.message });
  }
}

// ワーカー開始
main();
