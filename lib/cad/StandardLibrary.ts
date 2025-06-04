// CAD標準ライブラリクラス - CascadeStudioStandardLibraryを参考に実装

import type { CADStandardLibraryInterface } from '@/types/cad';

export class CADStandardLibrary implements CADStandardLibraryInterface {
  private oc: any;
  private sceneShapes: any[] = [];

  constructor(openCascadeInstance: any) {
    this.oc = openCascadeInstance;
  }

  // プリミティブ形状作成

  /**
   * ボックス（立方体）を作成
   * @param x X方向のサイズ
   * @param y Y方向のサイズ  
   * @param z Z方向のサイズ
   * @param centered 中心を原点にするかどうか（デフォルト: false）
   */
  Box(x: number, y: number, z: number, centered: boolean = false): any {
    if (!this.oc) throw new Error("OpenCascade not initialized");
    
    const box = new this.oc.BRepPrimAPI_MakeBox_2(x, y, z).Shape();
    
    if (centered) {
      const translatedBox = this.Translate([-x / 2, -y / 2, -z / 2], [box]);
      this.sceneShapes.push(translatedBox[0]);
      return translatedBox[0];
    }
    
    this.sceneShapes.push(box);
    return box;
  }

  /**
   * 球体を作成
   * @param radius 半径
   */
  Sphere(radius: number): any {
    if (!this.oc) throw new Error("OpenCascade not initialized");
    
    const spherePlane = new this.oc.gp_Ax2_1(
      new this.oc.gp_Pnt_1(0, 0, 0), 
      new this.oc.gp_Dir_1(0, 0, 1)
    );
    const sphere = new this.oc.BRepPrimAPI_MakeSphere_2(spherePlane, radius).Shape();
    
    this.sceneShapes.push(sphere);
    return sphere;
  }

  /**
   * 円柱を作成
   * @param radius 半径
   * @param height 高さ
   * @param centered 中心を原点にするかどうか（デフォルト: false）
   */
  Cylinder(radius: number, height: number, centered: boolean = false): any {
    if (!this.oc) throw new Error("OpenCascade not initialized");
    
    const cylinderPlane = new this.oc.gp_Ax2_1(
      new this.oc.gp_Pnt_1(0, 0, 0), 
      new this.oc.gp_Dir_1(0, 0, 1)
    );
    const cylinder = new this.oc.BRepPrimAPI_MakeCylinder_2(cylinderPlane, radius, height).Shape();
    
    if (centered) {
      const translatedCylinder = this.Translate([0, 0, -height / 2], [cylinder]);
      this.sceneShapes.push(translatedCylinder[0]);
      return translatedCylinder[0];
    }
    
    this.sceneShapes.push(cylinder);
    return cylinder;
  }

  // ブール演算

  /**
   * 複数の形状を結合（和集合）
   * @param shapes 結合する形状の配列
   */
  Union(shapes: any[]): any {
    if (!this.oc || !Array.isArray(shapes) || shapes.length === 0) return null;
    
    let result = shapes[0];
    for (let i = 1; i < shapes.length; i++) {
      const fuse = new this.oc.BRepAlgoAPI_Fuse_3(result, shapes[i], new this.oc.Message_ProgressRange_1());
      fuse.Build(new this.oc.Message_ProgressRange_1());
      result = fuse.Shape();
    }
    
    this.sceneShapes.push(result);
    return result;
  }

  /**
   * 形状から他の形状を減算（差集合）
   * @param mainShape メインの形状
   * @param subtractShapes 減算する形状の配列
   */
  Difference(mainShape: any, subtractShapes: any[]): any {
    if (!this.oc || !mainShape) return null;
    
    let result = mainShape;
    const shapesToSubtract = Array.isArray(subtractShapes) ? subtractShapes : [subtractShapes];
    
    for (const shape of shapesToSubtract) {
      const cut = new this.oc.BRepAlgoAPI_Cut_3(result, shape, new this.oc.Message_ProgressRange_1());
      cut.Build(new this.oc.Message_ProgressRange_1());
      result = cut.Shape();
    }
    
    this.sceneShapes.push(result);
    return result;
  }

  /**
   * 複数の形状の共通部分（積集合）
   * @param shapes 対象となる形状の配列
   */
  Intersection(shapes: any[]): any {
    if (!this.oc || !Array.isArray(shapes) || shapes.length < 2) return null;
    
    let result = shapes[0];
    for (let i = 1; i < shapes.length; i++) {
      const common = new this.oc.BRepAlgoAPI_Common_3(result, shapes[i], new this.oc.Message_ProgressRange_1());
      common.Build(new this.oc.Message_ProgressRange_1());
      result = common.Shape();
    }
    
    this.sceneShapes.push(result);
    return result;
  }

  // 変形操作

  /**
   * 形状を平行移動
   * @param offset [x, y, z] 移動量
   * @param shapes 移動する形状の配列
   */
  Translate(offset: [number, number, number], shapes: any[]): any[] {
    if (!this.oc || !Array.isArray(offset) || offset.length !== 3) return shapes;
    
    const tf = new this.oc.gp_Trsf_1();
    tf.SetTranslation_1(new this.oc.gp_Vec_4(offset[0], offset[1], offset[2]));
    const loc = new this.oc.TopLoc_Location_2(tf);
    
    return shapes.map(shape => shape.Moved(loc, false));
  }

  /**
   * 形状を回転
   * @param axis [x, y, z] 回転軸
   * @param degrees 回転角度（度）
   * @param shapes 回転する形状の配列
   */
  Rotate(axis: [number, number, number], degrees: number, shapes: any[]): any[] {
    if (!this.oc || !Array.isArray(axis) || axis.length !== 3) return shapes;
    
    const tf = new this.oc.gp_Trsf_1();
    const radians = degrees * Math.PI / 180;
    tf.SetRotation_1(
      new this.oc.gp_Ax1_2(
        new this.oc.gp_Pnt_1(0, 0, 0), 
        new this.oc.gp_Dir_4(axis[0], axis[1], axis[2])
      ), 
      radians
    );
    const loc = new this.oc.TopLoc_Location_2(tf);
    
    return shapes.map(shape => shape.Moved(loc, false));
  }

  /**
   * 形状を拡大縮小
   * @param factor 拡大縮小率（数値または[x, y, z]配列）
   * @param shapes 拡大縮小する形状の配列
   */
  Scale(factor: number | [number, number, number], shapes: any[]): any[] {
    if (!this.oc) return shapes;
    
    const tf = new this.oc.gp_Trsf_1();
    
    if (typeof factor === 'number') {
      tf.SetScaleFactor(factor);
    } else {
      // 非等方性スケールは複雑なので、まず等方性スケールのみサポート
      tf.SetScaleFactor(factor[0]);
    }
    
    const loc = new this.oc.TopLoc_Location_2(tf);
    
    return shapes.map(shape => shape.Moved(loc, false));
  }

  /**
   * 形状をミラー（鏡像）
   * @param plane [a, b, c, d] 平面の方程式 ax + by + cz + d = 0
   * @param shapes ミラーする形状の配列
   */
  Mirror(plane: [number, number, number, number], shapes: any[]): any[] {
    if (!this.oc || !Array.isArray(plane) || plane.length !== 4) return shapes;
    
    const tf = new this.oc.gp_Trsf_1();
    const mirrorPlane = new this.oc.gp_Pln_3(
      new this.oc.gp_Pnt_1(0, 0, -plane[3] / plane[2]), // 平面上の点
      new this.oc.gp_Dir_4(plane[0], plane[1], plane[2]) // 法線ベクトル
    );
    tf.SetMirror_2(mirrorPlane);
    const loc = new this.oc.TopLoc_Location_2(tf);
    
    const mirrored = shapes.map(shape => shape.Moved(loc, false));
    this.sceneShapes.push(...mirrored);
    return mirrored;
  }


  /**
   * 2D形状を押し出して3D形状を作成
   * @param shape 押し出す2D形状（Face、Wire等）
   * @param distance 押し出し距離
   * @param direction 押し出し方向（オプション、デフォルト: [0, 0, 1]）
   */
  Extrude(shape: any, distance: number, direction: [number, number, number] = [0, 0, 1]): any {
    if (!this.oc || !shape) throw new Error("Invalid shape for extrusion");
    
    try {
      const extrudeVector = new this.oc.gp_Vec_4(
        direction[0] * distance,
        direction[1] * distance, 
        direction[2] * distance
      );
      
      const extruded = new this.oc.BRepPrimAPI_MakePrism_1(shape, extrudeVector, false, true).Shape();
      
      this.sceneShapes.push(extruded);
      return extruded;
    } catch (error) {
      console.error("Extrude operation failed:", error);
      throw error;
    }
  }

  /**
   * 2D形状を回転軸周りに回転させて3D形状を作成
   * @param shape 回転させる2D形状
   * @param axis 回転軸 [x, y, z]
   * @param angle 回転角度（度）
   */
  Revolve(shape: any, axis: [number, number, number], angle: number): any {
    if (!this.oc || !shape) throw new Error("Invalid shape for revolution");
    
    try {
      const radians = angle * Math.PI / 180;
      const rotationAxis = new this.oc.gp_Ax1_2(
        new this.oc.gp_Pnt_1(0, 0, 0),
        new this.oc.gp_Dir_4(axis[0], axis[1], axis[2])
      );
      
      let revolved;
      if (angle >= 360) {
        revolved = new this.oc.BRepPrimAPI_MakeRevol_1(shape, rotationAxis, false).Shape();
      } else {
        revolved = new this.oc.BRepPrimAPI_MakeRevol_2(shape, rotationAxis, radians, false).Shape();
      }
      
      this.sceneShapes.push(revolved);
      return revolved;
    } catch (error) {
      console.error("Revolve operation failed:", error);
      throw error;
    }
  }

  /**
   * 複数の断面をロフトして3D形状を作成
   * @param profiles 断面形状の配列（Wire形状）
   */
  Loft(profiles: any[]): any {
    if (!this.oc || !Array.isArray(profiles) || profiles.length < 2) {
      throw new Error("Loft requires at least 2 profile shapes");
    }
    
    try {
      const loftBuilder = new this.oc.BRepOffsetAPI_ThruSections_1(true, false, 1e-6);
      
      for (const profile of profiles) {
        loftBuilder.AddWire(profile);
      }
      
      loftBuilder.Build();
      const lofted = loftBuilder.Shape();
      
      this.sceneShapes.push(lofted);
      return lofted;
    } catch (error) {
      console.error("Loft operation failed:", error);
      throw error;
    }
  }

  /**
   * エッジにフィレット（丸み）を適用
   * @param shape 対象の形状
   * @param radius フィレット半径
   * @param edges 対象エッジ（オプション、未指定時は全エッジ）
   */
  FilletEdges(shape: any, radius: number, edges?: any[]): any {
    if (!this.oc || !shape) throw new Error("Invalid shape for filleting");
    
    try {
      const filletBuilder = new this.oc.BRepFilletAPI_MakeFillet_1(shape, this.oc.ChFi3d_FilletShape.ChFi3d_Rational);
      
      if (edges && edges.length > 0) {
        for (const edge of edges) {
          filletBuilder.Add_2(radius, edge);
        }
      } else {
        const explorer = new this.oc.TopExp_Explorer_2(shape, this.oc.TopAbs_ShapeEnum.TopAbs_EDGE, this.oc.TopAbs_ShapeEnum.TopAbs_SHAPE);
        while (explorer.More()) {
          const edge = this.oc.TopoDS.Edge_1(explorer.Current());
          filletBuilder.Add_2(radius, edge);
          explorer.Next();
        }
      }
      
      filletBuilder.Build();
      const filleted = filletBuilder.Shape();
      
      this.sceneShapes.push(filleted);
      return filleted;
    } catch (error) {
      console.error("Fillet operation failed:", error);
      throw error;
    }
  }

  /**
   * エッジに面取りを適用
   * @param shape 対象の形状
   * @param distance 面取り距離
   * @param edges 対象エッジ（オプション、未指定時は全エッジ）
   */
  ChamferEdges(shape: any, distance: number, edges?: any[]): any {
    if (!this.oc || !shape) throw new Error("Invalid shape for chamfering");
    
    try {
      const chamferBuilder = new this.oc.BRepFilletAPI_MakeChamfer_1(shape);
      
      if (edges && edges.length > 0) {
        for (const edge of edges) {
          const explorer = new this.oc.TopExp_Explorer_2(shape, this.oc.TopAbs_ShapeEnum.TopAbs_FACE, this.oc.TopAbs_ShapeEnum.TopAbs_SHAPE);
          if (explorer.More()) {
            const face = this.oc.TopoDS.Face_1(explorer.Current());
            chamferBuilder.Add_3(distance, edge, face);
          }
        }
      } else {
        const edgeExplorer = new this.oc.TopExp_Explorer_2(shape, this.oc.TopAbs_ShapeEnum.TopAbs_EDGE, this.oc.TopAbs_ShapeEnum.TopAbs_SHAPE);
        while (edgeExplorer.More()) {
          const edge = this.oc.TopoDS.Edge_1(edgeExplorer.Current());
          
          const faceExplorer = new this.oc.TopExp_Explorer_2(shape, this.oc.TopAbs_ShapeEnum.TopAbs_FACE, this.oc.TopAbs_ShapeEnum.TopAbs_SHAPE);
          if (faceExplorer.More()) {
            const face = this.oc.TopoDS.Face_1(faceExplorer.Current());
            chamferBuilder.Add_3(distance, edge, face);
          }
          
          edgeExplorer.Next();
        }
      }
      
      chamferBuilder.Build();
      const chamfered = chamferBuilder.Shape();
      
      this.sceneShapes.push(chamfered);
      return chamfered;
    } catch (error) {
      console.error("Chamfer operation failed:", error);
      throw error;
    }
  }

  /**
   * 形状をオフセット
   * @param shape 対象の形状
   * @param distance オフセット距離（正の値で外側、負の値で内側）
   */
  Offset(shape: any, distance: number): any {
    if (!this.oc || !shape) throw new Error("Invalid shape for offset");
    
    try {
      const offsetBuilder = new this.oc.BRepOffsetAPI_MakeOffsetShape_1();
      offsetBuilder.PerformByJoin(shape, distance, 1e-6);
      
      const offset = offsetBuilder.Shape();
      
      this.sceneShapes.push(offset);
      return offset;
    } catch (error) {
      console.error("Offset operation failed:", error);
      throw error;
    }
  }

  // ユーティリティメソッド

  /**
   * シーンの形状をクリア
   */
  clearScene(): void {
    this.sceneShapes = [];
  }

  /**
   * 現在のシーン形状を取得
   */
  getSceneShapes(): any[] {
    return [...this.sceneShapes];
  }

  /**
   * OpenCascadeインスタンスを取得
   */
  getOpenCascade(): any {
    return this.oc;
  }
}  