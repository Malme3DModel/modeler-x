// Phase 2b: OpenCascade.js v1.1.1 ESM対応WebWorker
// ESM形式でのOpenCascade.js v1.1.1初期化

// OpenCascade.js v1.1.1のESMインポート
import { initOpenCascade } from 'opencascade.js';

// Define the persistent global variables
var oc = null, externalShapes = {}, sceneShapes = [],
  GUIState, fullShapeEdgeHashes = {}, fullShapeFaceHashes = {},
  currentShape, opNumber = 0, currentOp = "", currentLineNumber = 0,
  argCache = {}, usedHashes = {};

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

// Import required scripts using importScripts for WebWorker compatibility
importScripts('./CascadeStudioStandardLibrary.js');
importScripts('./CascadeStudioShapeToMesh.js');
importScripts('./opentype.js/dist/opentype.min.js');
importScripts('./CascadeStudioFileUtils.js');

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

// OpenCascade.js v1.1.1初期化関数
async function initializeOpenCascade() {
  try {
    console.log("=== OpenCascade.js v1.1.1 ESM Worker Initialization ===");
    
    // OpenCascade.js v1.1.1のESM形式で初期化
    const openCascade = await initOpenCascade({
      locateFile: (path) => {
        if (path.endsWith('.wasm')) {
          // v1.1.1では標準的なWASMパスを使用
          return '/js/libs/opencascade.wasm.wasm';
        }
        return path;
      }
    });
    
    oc = openCascade;
    console.log('OpenCascade.js v1.1.1 initialized successfully');
    
    // フォント読み込み
    await loadFonts();
    
    // API調査（v1.1.1用に更新）
    investigateAPI();
    
    // 初期化完了通知
    postMessage({ type: "startupCallback" });
    
    return true;
  } catch (error) {
    console.error('Failed to initialize OpenCascade.js v1.1.1:', error);
    postMessage({ type: "error", payload: error.message });
    return false;
  }
}

// Debug function to investigate v1.1.1 API
function investigateAPI() {
  console.log("=== OpenCascade.js v1.1.1 API Investigation ===");
  
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
    
    // Send detailed info to main thread with v1.1.1 version
    postMessage({ 
      type: "apiInvestigation", 
      payload: {
        version: "v1.1.1",
        trsfMethods: trsfMethods,
        rotationMethods: rotationMethods,
        setMethods: setMethods
      }
    });
  }
  
  // Check primitive creation APIs
  const primitiveAPIs = [
    'BRepPrimAPI_MakeBox',
    'BRepPrimAPI_MakeSphere', 
    'BRepPrimAPI_MakeCylinder',
    'BRepPrimAPI_MakeCone'
  ];
  
  console.log("=== Primitive Creation APIs ===");
  primitiveAPIs.forEach(apiName => {
    if (oc[apiName]) {
      console.log(`${apiName}: Available`);
      try {
        // Test the constructor signature
        if (apiName === 'BRepPrimAPI_MakeBox') {
          console.log("Testing BRepPrimAPI_MakeBox constructor...");
          const testBox = new oc.BRepPrimAPI_MakeBox(10, 10, 10);
          console.log("BRepPrimAPI_MakeBox object:", testBox);
          console.log("BRepPrimAPI_MakeBox methods:", Object.getOwnPropertyNames(testBox.constructor.prototype));
          
          // Check if Shape method exists
          if (typeof testBox.Shape === 'function') {
            console.log("testBox.Shape() method exists");
            try {
              const shape = testBox.Shape();
              console.log("testBox.Shape() returned:", shape);
            } catch (e) {
              console.log("testBox.Shape() error:", e.message);
            }
          } else {
            console.log("testBox.Shape() method NOT exists");
            console.log("Available methods on testBox:", Object.getOwnPropertyNames(testBox));
          }
        }
      } catch (e) {
        console.log(`${apiName} constructor error:`, e.message);
      }
    } else {
      console.log(`${apiName}: Not available`);
    }
  });
  
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
    console.log("=== ESM Worker v1.1.1 Starting ===");
    
    // OpenCascade.js v1.1.1初期化
    const ocInitialized = await initializeOpenCascade();
    if (!ocInitialized) {
      throw new Error("Failed to initialize OpenCascade.js v1.1.1");
    }
    
    // メッセージハンドラーの設定
    onmessage = function (e) {
      let response = messageHandlers[e.data.type](e.data.payload);
      if (response) { 
        postMessage({ "type": e.data.type, payload: response }); 
      }
    };
    
    console.log("=== ESM Worker v1.1.1 Ready ===");
    
  } catch (error) {
    console.error("ESM Worker v1.1.1 initialization failed:", error);
    postMessage({ type: "error", payload: error.message });
  }
}

// ワーカー開始
main();    