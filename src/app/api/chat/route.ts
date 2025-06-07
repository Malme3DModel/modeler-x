import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
        content: 'あなたはCADモデリングとプログラミングの専門家です。OpenCascade.jsを使用した3Dモデリングについて、親切で分かりやすい日本語で回答してください。コード例を含めて具体的にサポートしてください。'
      },
      ...messages.map((msg: any) => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }))
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: openaiMessages,
      max_tokens: 1000,
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