type Props = {
  text: string;
  className?: string;
};

export default function SubmitButton(props: Props) {
  return (
    <button
      className={`btn btn-primary rounded ${props.className}`}
    >
      {props.text}
    </button>
  );
}
