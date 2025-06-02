# TypeScript 型注釈導入ガイド

## 一般的な型エラーと修正方法

### 1. React コンポーネントの Props

**Before:**
```typescript
function MyComponent(props) {
  return <div>{props.title}</div>
}
```

**After:**
```typescript
interface MyComponentProps {
  title: string;
}

function MyComponent(props: MyComponentProps) {
  return <div>{props.title}</div>
}
```

### 2. Event Handler の型

**Before:**
```typescript
const handleClick = (e) => {
  console.log(e.target.value);
}
```

**After:**
```typescript
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  console.log(e.currentTarget.value);
}
```

### 3. State の型

**Before:**
```typescript
const [data, setData] = useState();
```

**After:**
```typescript
interface DataType {
  id: number;
  name: string;
}

const [data, setData] = useState<DataType | null>(null);
```

### 4. 外部ライブラリの型定義

必要に応じて以下のコマンドで型定義をインストール:
```bash
npm install --save-dev @types/[library-name]
```

### 5. any 型の暫定使用

型定義が難しい場合は一時的に `any` を使用:
```typescript
// TODO: 適切な型定義に置き換える
const complexData: any = getComplexData();
``` 