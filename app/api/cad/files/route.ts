import { NextRequest, NextResponse } from 'next/server';

// ファイルI/O API Route
// STEP/STL/OBJファイルのアップロード・ダウンロード処理

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const operation = formData.get('operation') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    // ファイル形式の検証
    const allowedExtensions = ['.step', '.stp', '.stl', '.obj', '.iges', '.igs'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: `サポートされていないファイル形式です: ${fileExtension}` },
        { status: 400 }
      );
    }

    // ファイルサイズの制限（50MB）
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'ファイルサイズが大きすぎます（最大50MB）' },
        { status: 400 }
      );
    }

    // ファイルデータを読み込み
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // ファイル情報を返却
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      extension: fileExtension,
      data: Array.from(uint8Array), // WebWorkerで処理するためにArrayに変換
      lastModified: file.lastModified,
      uploadedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: 'ファイルが正常にアップロードされました',
      file: fileInfo
    });

  } catch (error) {
    console.error('ファイルアップロードエラー:', error);
    return NextResponse.json(
      { error: 'ファイルアップロード中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');
    const filename = searchParams.get('filename') || 'export';

    // サポートされているエクスポート形式
    const supportedFormats = ['step', 'stl', 'obj'];
    
    if (!format || !supportedFormats.includes(format.toLowerCase())) {
      return NextResponse.json(
        { error: 'サポートされていないエクスポート形式です' },
        { status: 400 }
      );
    }

    // エクスポート情報を返却（実際のファイル生成はWebWorkerで行う）
    return NextResponse.json({
      success: true,
      message: 'エクスポート準備完了',
      format: format.toLowerCase(),
      filename: `${filename}.${format.toLowerCase()}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('ファイルエクスポートエラー:', error);
    return NextResponse.json(
      { error: 'ファイルエクスポート中にエラーが発生しました' },
      { status: 500 }
    );
  }
} 