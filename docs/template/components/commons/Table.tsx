type Props = {
  headers: string[];
  data: Array<any>[];
};

export default function Table({ headers, data }: Readonly<Props>) {
  return (
    <table className="table table-zebra">
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header}>{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
