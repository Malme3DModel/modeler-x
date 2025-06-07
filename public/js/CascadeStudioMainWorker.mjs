// Phase 2: OpenCascade.js v1.1.1 ESM対応WebWorker
// ESM形式でのOpenCascade.js v1.1.1初期化

// OpenCascade.js v1.1.1のESMインポート（将来の実装用）
// import { initOpenCascade } from 'opencascade.js';

// 現在はv0.1.15を使用（段階的移行）
// importScripts('./libs/opencascade.wasm.v0-modified.js');

// Define the persistent global variables
var oc = null, externalShapes = {}, sceneShapes = [],
  GUIState, fullShapeEdgeHashes = {}, fullShapeFaceHashes = {},
  currentShape;

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
    // 段階的移行：まずは既存のimportScriptsを使用
    // 将来的にはESMインポートに置き換え
    
    // 既存のスクリプトを動的に読み込み
    const scripts = [
      './CascadeStudioStandardLibrary.js',
      './CascadeStudioShapeToMesh.js',
      './libs/opencascade.wasm.v0-modified.js',
      './opentype.js/dist/opentype.min.js'
    ];
    
    for (const script of scripts) {
      await loadScript(script);
    }
    
    console.log("All dependencies loaded successfully");
    return true;
  } catch (error) {
    console.error("Failed to load dependencies:", error);
    return false;
  }
}

// スクリプトを動的に読み込む関数
function loadScript(src) {
  return new Promise((resolve, reject) => {
    try {
      // WebWorker環境でのスクリプト読み込み
      importScripts(src);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
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

// OpenCascade.js初期化関数（v1.1.1対応準備）
async function initializeOpenCascade() {
  try {
    console.log("=== OpenCascade.js ESM Worker Initialization ===");
    
    // Phase 2: 将来的にはESM形式で初期化
    // const openCascade = await initOpenCascade({
    //   locateFile: (path) => {
    //     if (path.endsWith('.wasm')) {
    //       return '/js/libs/opencascade.wasm';
    //     }
    //     return path;
    //   }
    // });
    
    // 現在はv0.1.15を使用（段階的移行）
    const openCascade = await new opencascade({
      locateFile(path) {
        if (path.endsWith('.wasm')) {
          return "./libs/opencascade.wasm.wasm";
        }
        return path;
      }
    });
    
    oc = openCascade;
    console.log('OpenCascade.js initialized successfully (v0.1.15 compatibility mode)');
    
    // フォント読み込み
    await loadFonts();
    
    // API調査
    investigateAPI();
    
    // 初期化完了通知
    postMessage({ type: "startupCallback" });
    
    return true;
  } catch (error) {
    console.error('Failed to initialize OpenCascade.js:', error);
    postMessage({ type: "error", payload: error.message });
    return false;
  }
}

// Debug function to investigate v0.1.15 API
function investigateAPI() {
  console.log("=== OpenCascade.js v0.1.15 API Investigation ===");
  
  // Check gp_Trsf methods
  if (oc.gp_Trsf) {
    const trsf = new oc.gp_Trsf();
    console.log("gp_Trsf methods:");
    const trsfMethods = Object.getOwnPropertyNames(oc.gp_Trsf.prototype);
    const rotationMethods = trsfMethods.filter(method => method.toLowerCase().includes('rot'));
    console.log("Rotation-related methods:", rotationMethods);
    
    // Check all methods with 'Set' prefix
    const setMethods = trsfMethods.filter(method => method.startsWith('Set'));
    console.log("Set methods:", setMethods);
    
    // Check all available methods
    console.log("All gp_Trsf methods:", trsfMethods);
    
    // Send detailed info to main thread
    postMessage({ 
      type: "apiInvestigation", 
      payload: {
        trsfMethods: trsfMethods,
        rotationMethods: rotationMethods,
        setMethods: setMethods
      }
    });
  }
  
  console.log("=== End API Investigation ===");
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
      Object.assign(fullShapeEdgeHashes, ForEachEdge(sceneShapes[shapeInd], (index, edge) => { }));
      ForEachFace(sceneShapes[shapeInd], (index, face) => {
        fullShapeFaceHashes[face.HashCode(100000000)] = index;
      });

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
    console.log("=== ESM Worker Starting ===");
    
    // 依存関係の読み込み
    const dependenciesLoaded = await loadDependencies();
    if (!dependenciesLoaded) {
      throw new Error("Failed to load dependencies");
    }
    
    // OpenCascade.js初期化
    const ocInitialized = await initializeOpenCascade();
    if (!ocInitialized) {
      throw new Error("Failed to initialize OpenCascade.js");
    }
    
    // メッセージハンドラーの設定
    onmessage = function (e) {
      let response = messageHandlers[e.data.type](e.data.payload);
      if (response) { 
        postMessage({ "type": e.data.type, payload: response }); 
      }
    };
    
    console.log("=== ESM Worker Ready ===");
    
  } catch (error) {
    console.error("ESM Worker initialization failed:", error);
    postMessage({ type: "error", payload: error.message });
  }
}

// ワーカー開始
main(); 