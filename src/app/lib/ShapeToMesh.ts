// v0版のShapeToMesh機能をTypeScriptで移植
// OpenCascade.jsを使用してCAD形状をThree.js用のメッシュデータに変換

import * as THREE from 'three';

declare global {
  interface Window {
    oc: any;
  }
}

interface FaceData {
  vertex_coord: number[];
  uv_coord: number[];
  normal_coord: number[];
  tri_indexes: number[];
  number_of_triangles: number;
  face_index: number;
}

interface EdgeData {
  vertex_coord: number[];
  edge_index: number;
}

// カーブの長さを計算する関数
function LengthOfCurve(geomAdaptor: any, UMin: number, UMax: number, segments: number = 5): number {
  const point1 = new THREE.Vector3();
  const point2 = new THREE.Vector3();
  let arcLength = 0;
  const gpPnt = new window.oc.gp_Pnt();
  
  for (let s = UMin; s <= UMax; s += (UMax - UMin) / segments) {
    geomAdaptor.D0(s, gpPnt);
    point1.set(gpPnt.X(), gpPnt.Y(), gpPnt.Z());
    if (s === UMin) {
      point2.copy(point1);
    } else {
      arcLength += point1.distanceTo(point2);
    }
    point2.copy(point1);
  }
  return arcLength;
}

// 各フェイスを反復処理する関数
function ForEachFace(shape: any, callback: (index: number, face: any) => void): void {
  const oc = window.oc;
  const faceExplorer = new oc.TopExp_Explorer(shape, oc.TopAbs_FACE);
  let faceIndex = 0;
  
  while (faceExplorer.More()) {
    const face = oc.TopoDS.prototype.Face(faceExplorer.Current());
    callback(faceIndex, face);
    faceExplorer.Next();
    faceIndex++;
  }
}

// 各エッジを反復処理する関数
function ForEachEdge(shape: any, callback: (index: number, edge: any) => void): void {
  const oc = window.oc;
  const edgeExplorer = new oc.TopExp_Explorer(shape, oc.TopAbs_EDGE);
  let edgeIndex = 0;
  
  while (edgeExplorer.More()) {
    const edge = oc.TopoDS.prototype.Edge(edgeExplorer.Current());
    callback(edgeIndex, edge);
    edgeExplorer.Next();
    edgeIndex++;
  }
}

// potpack アルゴリズムの簡易実装
function potpack(boxes: Array<{ w: number; h: number; index: number }>): { w: number; h: number } {
  // ボックスを面積の降順でソート
  boxes.sort((a, b) => (b.w * b.h) - (a.w * a.h));
  
  let totalArea = 0;
  for (const box of boxes) {
    totalArea += box.w * box.h;
  }
  
  // 初期サイズを推定
  let size = Math.ceil(Math.sqrt(totalArea));
  
  // 簡単な配置アルゴリズム
  let x = 0, y = 0, rowHeight = 0;
  
  for (const box of boxes) {
    if (x + box.w > size) {
      x = 0;
      y += rowHeight;
      rowHeight = 0;
    }
    
    (box as any).x = x;
    (box as any).y = y;
    
    x += box.w;
    rowHeight = Math.max(rowHeight, box.h);
  }
  
  return { w: size, h: y + rowHeight };
}

// メインのShapeToMesh関数
export function ShapeToMesh(
  shape: any, 
  maxDeviation: number, 
  fullShapeEdgeHashes: Record<number, number>, 
  fullShapeFaceHashes: Record<number, number>
): [FaceData[], EdgeData[]] {
  const oc = window.oc;
  const facelist: FaceData[] = [];
  const edgeList: EdgeData[] = [];
  
  try {
    shape = new oc.TopoDS_Shape(shape);

    // インクリメンタルメッシュビルダーを設定
    new oc.BRepMesh_IncrementalMesh(shape, maxDeviation, false, maxDeviation * 5);

    // エッジハッシュを構築
    const fullShapeEdgeHashes2: Record<number, number> = {};

    // フェイスを反復処理して三角形分割
    const triangulations: any[] = [];
    const uv_boxes: Array<{ w: number; h: number; index: number }> = [];
    let curFace = 0;

    ForEachFace(shape, (faceIndex: number, myFace: any) => {
      const aLocation = new oc.TopLoc_Location();
      const myT = oc.BRep_Tool.prototype.Triangulation(myFace, aLocation);
      if (myT.IsNull()) {
        console.error("Encountered Null Face!");
        return;
      }

      const this_face: FaceData = {
        vertex_coord: [],
        uv_coord: [],
        normal_coord: [],
        tri_indexes: [],
        number_of_triangles: 0,
        face_index: fullShapeFaceHashes[myFace.HashCode(100000000)]
      };

      const pc = new oc.Poly_Connect(myT);
      const Nodes = myT.get().Nodes();

      // 頂点バッファを書き込み
      this_face.vertex_coord = new Array(Nodes.Length() * 3);
      for (let i = 0; i < Nodes.Length(); i++) {
        const p = Nodes.Value(i + 1).Transformed(aLocation.Transformation());
        this_face.vertex_coord[(i * 3) + 0] = p.X();
        this_face.vertex_coord[(i * 3) + 1] = p.Y();
        this_face.vertex_coord[(i * 3) + 2] = p.Z();
      }

      // UVバッファを書き込み
      const orient = myFace.Orientation();
      if (myT.get().HasUVNodes()) {
        let UMin = 0, UMax = 0, VMin = 0, VMax = 0;

        const UVNodes = myT.get().UVNodes();
        const UVNodesLength = UVNodes.Length();
        this_face.uv_coord = new Array(UVNodesLength * 2);
        
        for (let i = 0; i < UVNodesLength; i++) {
          const p = UVNodes.Value(i + 1);
          const x = p.X(), y = p.Y();
          this_face.uv_coord[(i * 2) + 0] = x;
          this_face.uv_coord[(i * 2) + 1] = y;

          // UV境界を計算
          if (i === 0) { UMin = x; UMax = x; VMin = y; VMax = y; }
          if (x < UMin) { UMin = x; } else if (x > UMax) { UMax = x; }
          if (y < VMin) { VMin = y; } else if (y > VMax) { VMax = y; }
        }

        // フェイスの等パラメトリック曲線の弧長を計算
        const surface = oc.BRep_Tool.prototype.Surface(myFace).get();
        const UIso_Handle = surface.UIso(UMin + ((UMax - UMin) * 0.5));
        const VIso_Handle = surface.VIso(VMin + ((VMax - VMin) * 0.5));
        const UAdaptor = new oc.GeomAdaptor_Curve(VIso_Handle);
        const VAdaptor = new oc.GeomAdaptor_Curve(UIso_Handle);
        
        uv_boxes.push({
          w: LengthOfCurve(UAdaptor, UMin, UMax),
          h: LengthOfCurve(VAdaptor, VMin, VMax),
          index: curFace
        });

        // 各フェイスのUVを0-1に正規化
        for (let i = 0; i < UVNodesLength; i++) {
          let x = this_face.uv_coord[(i * 2) + 0];
          let y = this_face.uv_coord[(i * 2) + 1];
          
          x = ((x - UMin) / (UMax - UMin));
          y = ((y - VMin) / (VMax - VMin));
          if (orient !== oc.TopAbs_FORWARD) { x = 1.0 - x; }

          this_face.uv_coord[(i * 2) + 0] = x;
          this_face.uv_coord[(i * 2) + 1] = y;
        }
      }

      // 法線バッファを書き込み
      const myNormal = new oc.TColgp_Array1OfDir(Nodes.Lower(), Nodes.Upper());
      const SST = new oc.StdPrs_ToolTriangulatedShape();
      SST.Normal(myFace, pc, myNormal);
      this_face.normal_coord = new Array(myNormal.Length() * 3);
      
      for (let i = 0; i < myNormal.Length(); i++) {
        const d = myNormal.Value(i + 1).Transformed(aLocation.Transformation());
        this_face.normal_coord[(i * 3) + 0] = d.X();
        this_face.normal_coord[(i * 3) + 1] = d.Y();
        this_face.normal_coord[(i * 3) + 2] = d.Z();
      }

      // 三角形バッファを書き込み
      const triangles = myT.get().Triangles();
      this_face.tri_indexes = new Array(triangles.Length() * 3);
      let validFaceTriCount = 0;
      
      for (let nt = 1; nt <= myT.get().NbTriangles(); nt++) {
        const t = triangles.Value(nt);
        let n1 = t.Value(1);
        let n2 = t.Value(2);
        let n3 = t.Value(3);
        
        if (orient !== oc.TopAbs_FORWARD) {
          const tmp = n1;
          n1 = n2;
          n2 = tmp;
        }
        
        this_face.tri_indexes[(validFaceTriCount * 3) + 0] = n1 - 1;
        this_face.tri_indexes[(validFaceTriCount * 3) + 1] = n2 - 1;
        this_face.tri_indexes[(validFaceTriCount * 3) + 2] = n3 - 1;
        validFaceTriCount++;
      }
      
      this_face.number_of_triangles = validFaceTriCount;
      facelist.push(this_face);
      curFace += 1;

      // フェイス上のエッジを処理
      ForEachEdge(myFace, (index: number, myEdge: any) => {
        const edgeHash = myEdge.HashCode(100000000);
        if (fullShapeEdgeHashes2.hasOwnProperty(edgeHash)) {
          const this_edge: EdgeData = {
            vertex_coord: [],
            edge_index: -1
          };

          const myP = oc.BRep_Tool.prototype.PolygonOnTriangulation(myEdge, myT, aLocation);
          const edgeNodes = myP.get().Nodes();

          // 頂点バッファを書き込み
          this_edge.vertex_coord = new Array(edgeNodes.Length() * 3);
          for (let j = 0; j < edgeNodes.Length(); j++) {
            const vertexIndex = edgeNodes.Value(j + 1);
            this_edge.vertex_coord[(j * 3) + 0] = this_face.vertex_coord[((vertexIndex - 1) * 3) + 0];
            this_edge.vertex_coord[(j * 3) + 1] = this_face.vertex_coord[((vertexIndex - 1) * 3) + 1];
            this_edge.vertex_coord[(j * 3) + 2] = this_face.vertex_coord[((vertexIndex - 1) * 3) + 2];
          }

          this_edge.edge_index = fullShapeEdgeHashes[edgeHash];
          edgeList.push(this_edge);
        } else {
          fullShapeEdgeHashes2[edgeHash] = edgeHash;
        }
      });
      
      triangulations.push(myT);
    });

    // 各フェイスのUVをワールドスペースにスケールし、0-1アトラスにパック
    const padding = 2;
    for (let f = 0; f < uv_boxes.length; f++) {
      uv_boxes[f].w += padding;
      uv_boxes[f].h += padding;
    }
    
    const packing_stats = potpack(uv_boxes);
    
    for (let f = 0; f < uv_boxes.length; f++) {
      const box = uv_boxes[f];
      const this_face = facelist[box.index];
      
      for (let q = 0; q < this_face.uv_coord.length / 2; q++) {
        let x = this_face.uv_coord[(q * 2) + 0];
        let y = this_face.uv_coord[(q * 2) + 1];
        
        x = ((x * (box.w - padding)) + ((box as any).x + (padding * 0.5))) / Math.max(packing_stats.w, packing_stats.h);
        y = ((y * (box.h - padding)) + ((box as any).y + (padding * 0.5))) / Math.max(packing_stats.w, packing_stats.h);

        this_face.uv_coord[(q * 2) + 0] = x;
        this_face.uv_coord[(q * 2) + 1] = y;
      }
    }

    // 実行間で三角形分割を無効化してキャッシュに保存されないようにする
    for (let i = 0; i < triangulations.length; i++) {
      triangulations[i].Nullify();
    }

    // 三角形分割されたフェイス/サーフェス上にない自由エッジを取得
    ForEachEdge(shape, (index: number, myEdge: any) => {
      const edgeHash = myEdge.HashCode(100000000);
      if (!fullShapeEdgeHashes2.hasOwnProperty(edgeHash)) {
        const this_edge: EdgeData = {
          vertex_coord: [],
          edge_index: -1
        };

        const aLocation = new oc.TopLoc_Location();
        const adaptorCurve = new oc.BRepAdaptor_Curve(myEdge);
        const tangDef = new oc.GCPnts_TangentialDeflection(adaptorCurve, maxDeviation, 0.1);

        // 頂点バッファを書き込み
        this_edge.vertex_coord = new Array(tangDef.NbPoints() * 3);
        for (let j = 0; j < tangDef.NbPoints(); j++) {
          const vertex = tangDef.Value(j + 1).Transformed(aLocation.Transformation());
          this_edge.vertex_coord[(j * 3) + 0] = vertex.X();
          this_edge.vertex_coord[(j * 3) + 1] = vertex.Y();
          this_edge.vertex_coord[(j * 3) + 2] = vertex.Z();
        }

        this_edge.edge_index = fullShapeEdgeHashes[edgeHash];
        fullShapeEdgeHashes2[edgeHash] = edgeHash;

        edgeList.push(this_edge);
      }
    });

  } catch (err: any) {
    setTimeout(() => {
      err.message = "INTERNAL OPENCASCADE ERROR DURING GENERATE: " + err.message;
      throw err;
    }, 0);
  }

  return [facelist, edgeList];
}

export type { FaceData, EdgeData }; 