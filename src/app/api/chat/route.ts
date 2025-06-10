import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// OpenCascade.js用のsystem prompt
const SYSTEM_PROMPT = `あなたはCADモデリングとOpenCascade.jsの専門家です。

利用可能な主要関数：
【基本形状】
- Box(width, height, depth) - 直方体
- Sphere(radius) - 球体  
- Cylinder(radius, height, centered?) - 円柱
- Cone(radius1, radius2, height) - 円錐
- Text3D(text, size, thickness, font?) - 3Dテキスト
- Polygon(points[][]) - ポリゴン
- Circle(radius, wire?) - 円

【変形操作】
- Translate(offset[], shape) - 移動
- Rotate(axis[], degrees, shape) - 回転
- Scale(scale, shape) - 拡大縮小
- Mirror(vector[], shape) - ミラー

【ブール演算】
- Union(shapes[]) - 結合
- Difference(base, tools[]) - 差分
- Intersection(shapes[]) - 交差

【高度な操作】
- Extrude(profile, height) - 押し出し
- Revolve(shape, degrees?, axis?) - 回転体
- Loft(profiles[]) - ロフト
- Pipe(shape, path) - パイプ
- FilletEdges(shape, radius, edges[]) - フィレット
- ChamferEdges(shape, distance, edges[]) - 面取り
- Offset(shape, distance) - オフセット

【GUI要素】
- Slider(name, default, min, max) - スライダー
- Checkbox(name, default) - チェックボックス
- TextInput(name, default) - テキスト入力
- Dropdown(name, default, options) - ドロップダウン

【重要なルール】
1. 必ず実行可能なTypeScriptコードで回答してください
` +
"2. コードは```typescriptで囲んでください" + `
3. 作成した形状は sceneShapes.push() で追加してください
4. 日本語でコメントを付けてください
5. 具体的で実用的な例を示してください

例：
` +
"```typescript" + `
// 基本的な箱を作成
let box = Box(50, 30, 20);
sceneShapes.push(box);

// 球体を作成して移動
let sphere = Sphere(25);
let movedSphere = Translate([0, 0, 40], sphere);
sceneShapes.push(movedSphere);
` +
"```" +
`

親切で分かりやすい日本語で説明し、必ず実行可能なコードを含めて回答してください。`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'メッセージが無効です' },
        { status: 400 }
      );
    }

    // OpenAI APIに送信するメッセージを準備
    const openaiMessages = [
      {
        role: 'system' as const,
        content: SYSTEM_PROMPT
      },
      ...messages.map((msg: any) => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }))
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: openaiMessages,
      max_tokens: 1500,
      temperature: 0.7,
    });

    const assistantMessage = completion.choices[0]?.message?.content;

    if (!assistantMessage) {
      return NextResponse.json(
        { error: 'AIからの応答を取得できませんでした' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: assistantMessage
    });

  } catch (error) {
    console.error('OpenAI API エラー:', error);
    
    if (error instanceof Error) {
      // API キーが無効な場合
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API キーが無効です。環境変数OPENAI_API_KEYを確認してください。' },
          { status: 401 }
        );
      }
      
      // レート制限の場合
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'API使用量の制限に達しました。しばらく待ってから再試行してください。' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'AIサービスでエラーが発生しました。しばらく待ってから再試行してください。' },
      { status: 500 }
    );
  }
} 