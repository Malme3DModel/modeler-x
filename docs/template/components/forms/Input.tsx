"use client";

import { useEffect, useState } from "react";

type Props = {
  label: string;
  type: string;
  name: string;
  value?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
};

export default function FormInput(props: Props) {
  const [value, setValue] = useState(props.value);

  useEffect(() => {
    setValue(props.value);
  }, [props.value]);

  return (
    <div>
      <label className="label">
        <span className="text-sm label-text">{props.label}</span>
      </label>
      <input
        type={props.type}
        name={props.name}
        value={value}
        placeholder={props.placeholder}
        required={props.required}
        className={`input input-bordered rounded ${props.className}`}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}
