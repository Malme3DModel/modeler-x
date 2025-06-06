// Define the persistent global variables
var oc = null, externalShapes = {}, sceneShapes = [],
  GUIState, fullShapeEdgeHashes = {}, fullShapeFaceHashes = {},
  currentShape;

// Capture Logs and Errors and forward them to the main thread
let realConsoleLog   = console.log;
let realConsoleError = console.error;
console.log = function (message) {
  //postMessage({ type: "log", payload: message });
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
}; // This is actually accessed via worker.onerror in the main thread

// Import the set of scripts we'll need to perform all the CAD operations
importScripts(
  './three/build/three.min.js',
  './CascadeStudioStandardLibrary.js',
  './CascadeStudioShapeToMesh.js',
  './libs/opencascade.wasm.v0-modified.js',
  './opentype.js/dist/opentype.min.js');

// Preload the Various Fonts that are available via Text3D
var preloadedFonts = ['/fonts/Roboto.ttf',
  '/fonts/Papyrus.ttf', '/fonts/Consolas.ttf'];
var fonts = {};
async function loadFonts() {
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
  
  console.log("Font loading complete. Available fonts:", Object.keys(fonts));
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
  
  // Check alternative transformation classes
  const transformClasses = [
    'BRepBuilderAPI_Transform',
    'TopLoc_Location', 
    'gp_Ax1',
    'gp_Ax2',
    'gp_Dir',
    'gp_Vec',
    'gp_Pnt',
    'gp_Quaternion',
    'gp_Mat'
  ];
  
  console.log("=== Available transformation classes ===");
  transformClasses.forEach(className => {
    if (oc[className]) {
      console.log(`${className}: Available`);
      try {
        const methods = Object.getOwnPropertyNames(oc[className].prototype);
        const rotMethods = methods.filter(m => m.toLowerCase().includes('rot'));
        if (rotMethods.length > 0) {
          console.log(`  - Rotation methods: ${rotMethods}`);
        }
      } catch (e) {
        console.log(`  - Error checking methods: ${e.message}`);
      }
    } else {
      console.log(`${className}: Not available`);
    }
  });
  
  // Check BRepMesh_IncrementalMesh
  if (oc.BRepMesh_IncrementalMesh) {
    console.log("BRepMesh_IncrementalMesh is available");
    // Try to see constructor signature
    try {
      const testShape = new oc.TopoDS_Shape();
      console.log("Testing BRepMesh_IncrementalMesh constructor...");
    } catch (e) {
      console.log("BRepMesh_IncrementalMesh constructor error:", e.message);
    }
  } else {
    console.log("BRepMesh_IncrementalMesh not found");
  }
  
  console.log("=== End API Investigation ===");
}

// Load the full Open Cascade Web Assembly Module
var messageHandlers = {};
new opencascade({
  locateFile(path) {
    if (path.endsWith('.wasm')) {
      return "./libs/opencascade.wasm.wasm";
    }
    return path;
  }
}).then((openCascade) => {
  // Register the "OpenCascade" WebAssembly Module under the shorthand "oc"
  oc = openCascade;
  
  loadFonts();
  
  // Investigate API after loading
  investigateAPI();

  // Ping Pong Messages Back and Forth based on their registration in messageHandlers
  onmessage = function (e) {
    let response = messageHandlers[e.data.type](e.data.payload);
    if (response) { postMessage({ "type": e.data.type, payload: response }); };
  }

  // Initial Evaluation after everything has been loaded...
  postMessage({ type: "startupCallback" });
});

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

// Import the File IO Utilities
importScripts('./CascadeStudioFileUtils.js');
