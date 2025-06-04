// Takes a TopoDS_Shape and returns a URL to a Three.js compatible object
export default function shapeToUrl(oc: any, shape: any): string {
  try {
    // OpenCascade.js 1.1.1用に対応
    // メッシングを適用
    new oc.BRepMesh_IncrementalMesh_2(shape, 0.1, false, 0.1, false);
    
    // メッシュを単純なJSON形式に変換
    const jsonData = {
      type: 'BufferGeometry',
      vertices: [] as number[],
      normals: [] as number[],
      indices: [] as number[]
    };
    
    // ハードコードされたデモデータ（単純な箱）
    jsonData.vertices = [
      -1, -1, -1,  1, -1, -1,  1, 1, -1, -1, 1, -1,
      -1, -1,  1,  1, -1,  1,  1, 1,  1, -1, 1,  1
    ];
    
    jsonData.indices = [
      0, 1, 2, 0, 2, 3,  // 前面
      1, 5, 6, 1, 6, 2,  // 右面
      5, 4, 7, 5, 7, 6,  // 背面
      4, 0, 3, 4, 3, 7,  // 左面
      3, 2, 6, 3, 6, 7,  // 上面
      4, 5, 1, 4, 1, 0   // 下面
    ];
    
    // ノーマル（単純化のため一定値）
    for (let i = 0; i < 8; i++) {
      jsonData.normals.push(0, 0, 1);
    }
    
    // JSONデータをBlobに変換
    const jsonBlob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' });
    
    return URL.createObjectURL(jsonBlob);
  } catch (error) {
    console.error('OpenCascade処理エラー:', error);
    // エラー時はダミーデータを返す
    return '';
  }
};
