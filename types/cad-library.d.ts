/**
 * CAD標準ライブラリ型定義
 * CascadeStudio互換のCAD関数群
 */

// 基本型定義
export type Vector3 = [number, number, number];
export type Vector4 = [number, number, number, number];
export type CADShape = any; // OpenCascade.jsの形状オブジェクト

/**
 * プリミティブ形状作成関数
 */

/**
 * 直方体を作成します
 * @param x X方向のサイズ
 * @param y Y方向のサイズ  
 * @param z Z方向のサイズ
 * @param centered 中心に配置するかどうか（デフォルト: false）
 * @returns CAD形状オブジェクト
 * @example
 * const box = Box(10, 10, 10, true);
 */
declare function Box(x: number, y: number, z: number, centered?: boolean): CADShape;

/**
 * 球体を作成します
 * @param radius 半径
 * @returns CAD形状オブジェクト
 * @example
 * const sphere = Sphere(5);
 */
declare function Sphere(radius: number): CADShape;

/**
 * 円柱を作成します
 * @param radius 半径
 * @param height 高さ
 * @param centered 中心に配置するかどうか（デフォルト: false）
 * @returns CAD形状オブジェクト
 * @example
 * const cylinder = Cylinder(5, 10, true);
 */
declare function Cylinder(radius: number, height: number, centered?: boolean): CADShape;

/**
 * 円錐を作成します
 * @param radius 底面の半径
 * @param height 高さ
 * @param centered 中心に配置するかどうか（デフォルト: false）
 * @returns CAD形状オブジェクト
 * @example
 * const cone = Cone(5, 10, true);
 */
declare function Cone(radius: number, height: number, centered?: boolean): CADShape;

/**
 * 多角形を作成します
 * @param points 頂点座標の配列
 * @returns CAD形状オブジェクト
 * @example
 * const triangle = Polygon([[0,0], [10,0], [5,10]]);
 */
declare function Polygon(points: Array<[number, number]>): CADShape;

/**
 * 円を作成します
 * @param radius 半径
 * @returns CAD形状オブジェクト
 * @example
 * const circle = Circle(5);
 */
declare function Circle(radius: number): CADShape;

/**
 * ブール演算関数
 */

/**
 * 形状の和集合を作成します
 * @param shapes 結合する形状の配列
 * @returns 結合された形状
 * @example
 * const result = Union([box, sphere]);
 */
declare function Union(shapes: CADShape[]): CADShape;

/**
 * 形状の差集合を作成します
 * @param shape ベースとなる形状
 * @param tools 削除する形状の配列
 * @returns 差集合の形状
 * @example
 * const result = Difference(box, [sphere]);
 */
declare function Difference(shape: CADShape, tools: CADShape[]): CADShape;

/**
 * 形状の積集合を作成します
 * @param shapes 交差させる形状の配列
 * @returns 交差部分の形状
 * @example
 * const result = Intersection([box, sphere]);
 */
declare function Intersection(shapes: CADShape[]): CADShape;

/**
 * 変形操作関数
 */

/**
 * 形状を平行移動します
 * @param vector 移動ベクトル [x, y, z]
 * @param shapes 移動する形状の配列
 * @returns 移動された形状
 * @example
 * const moved = Translate([10, 0, 0], [box]);
 */
declare function Translate(vector: Vector3, shapes: CADShape[]): CADShape;

/**
 * 形状を回転します
 * @param axis 回転軸ベクトル [x, y, z]
 * @param angle 回転角度（度）
 * @param shapes 回転する形状の配列
 * @returns 回転された形状
 * @example
 * const rotated = Rotate([0, 0, 1], 45, [box]);
 */
declare function Rotate(axis: Vector3, angle: number, shapes: CADShape[]): CADShape;

/**
 * 形状をスケールします
 * @param factors スケール係数 [x, y, z]
 * @param shapes スケールする形状の配列
 * @returns スケールされた形状
 * @example
 * const scaled = Scale([2, 1, 1], [box]);
 */
declare function Scale(factors: Vector3, shapes: CADShape[]): CADShape;

/**
 * 形状をミラーリングします
 * @param plane ミラー平面 [a, b, c, d] (ax + by + cz + d = 0)
 * @param shapes ミラーリングする形状の配列
 * @returns ミラーリングされた形状
 * @example
 * const mirrored = Mirror([1, 0, 0, 0], [box]); // YZ平面でミラー
 */
declare function Mirror(plane: Vector4, shapes: CADShape[]): CADShape;

/**
 * 高度なCAD操作関数
 */

/**
 * 2D形状を押し出して3D形状を作成します
 * @param shape 押し出す2D形状
 * @param distance 押し出し距離
 * @param direction 押し出し方向（オプション）
 * @returns 押し出された3D形状
 * @example
 * const extruded = Extrude(circle, 10);
 */
declare function Extrude(shape: CADShape, distance: number, direction?: Vector3): CADShape;

/**
 * 2D形状を回転させて3D形状を作成します
 * @param shape 回転させる2D形状
 * @param axis 回転軸
 * @param angle 回転角度（度）
 * @returns 回転体
 * @example
 * const revolved = Revolve(profile, [0, 1, 0], 360);
 */
declare function Revolve(shape: CADShape, axis: Vector3, angle: number): CADShape;

/**
 * 複数の断面をロフトして3D形状を作成します
 * @param profiles 断面形状の配列
 * @returns ロフトされた形状
 * @example
 * const lofted = Loft([circle1, circle2, circle3]);
 */
declare function Loft(profiles: CADShape[]): CADShape;

/**
 * エッジにフィレットを適用します
 * @param shape 対象形状
 * @param radius フィレット半径
 * @param edges 対象エッジ（オプション）
 * @returns フィレットが適用された形状
 * @example
 * const filleted = FilletEdges(box, 2);
 */
declare function FilletEdges(shape: CADShape, radius: number, edges?: any[]): CADShape;

/**
 * エッジに面取りを適用します
 * @param shape 対象形状
 * @param distance 面取り距離
 * @param edges 対象エッジ（オプション）
 * @returns 面取りが適用された形状
 * @example
 * const chamfered = ChamferEdges(box, 1);
 */
declare function ChamferEdges(shape: CADShape, distance: number, edges?: any[]): CADShape;

/**
 * 形状をオフセットします
 * @param shape 対象形状
 * @param distance オフセット距離
 * @returns オフセットされた形状
 * @example
 * const offset = Offset(shape, 2);
 */
declare function Offset(shape: CADShape, distance: number): CADShape;

/**
 * GUI要素関数
 */

/**
 * スライダーGUI要素を作成します
 * @param name 変数名
 * @param defaultValue デフォルト値
 * @param min 最小値
 * @param max 最大値
 * @param step ステップ値
 * @returns スライダーの値
 * @example
 * const radius = Slider("radius", 5, 1, 10, 0.1);
 */
declare function Slider(name: string, defaultValue: number, min: number, max: number, step?: number): number;

/**
 * チェックボックスGUI要素を作成します
 * @param name 変数名
 * @param defaultValue デフォルト値
 * @returns チェックボックスの値
 * @example
 * const enabled = Checkbox("enabled", true);
 */
declare function Checkbox(name: string, defaultValue: boolean): boolean;

/**
 * ボタンGUI要素を作成します
 * @param name ボタン名
 * @returns ボタンが押されたかどうか
 * @example
 * const clicked = Button("Reset");
 */
declare function Button(name: string): boolean;

/**
 * テキスト入力GUI要素を作成します
 * @param name 変数名
 * @param defaultValue デフォルト値
 * @returns 入力されたテキスト
 * @example
 * const text = TextInput("label", "Hello");
 */
declare function TextInput(name: string, defaultValue: string): string;

/**
 * ドロップダウンGUI要素を作成します
 * @param name 変数名
 * @param options 選択肢の配列
 * @param defaultIndex デフォルトのインデックス
 * @returns 選択されたインデックス
 * @example
 * const selection = Dropdown("shape", ["Box", "Sphere", "Cylinder"], 0);
 */
declare function Dropdown(name: string, options: string[], defaultIndex: number): number;

/**
 * ユーティリティ関数
 */

/**
 * 3Dテキストを作成します
 * @param text テキスト内容
 * @param size フォントサイズ
 * @param height 押し出し高さ
 * @returns 3Dテキスト形状
 * @example
 * const text3d = Text3D("Hello", 10, 2);
 */
declare function Text3D(text: string, size: number, height: number): CADShape;

/**
 * 形状の情報を取得します
 * @param shape 対象形状
 * @returns 形状情報
 * @example
 * const info = GetShapeInfo(box);
 */
declare function GetShapeInfo(shape: CADShape): {
  volume: number;
  surfaceArea: number;
  boundingBox: {
    min: Vector3;
    max: Vector3;
  };
};

// グローバル変数として利用可能な定数
declare const PI: number;
declare const E: number; 