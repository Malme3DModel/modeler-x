export const datetimeFormat = (
  datetime: Date,
  format: string = "YYYY/MM/DD"
): string => {
  const date = new Date(datetime);

  const formatMapping: { [key: string]: string } = {
    YYYY: date.getFullYear().toString(),
    MM: ("0" + (date.getMonth() + 1)).slice(-2),
    DD: ("0" + date.getDate()).slice(-2),
    HH: ("0" + date.getHours()).slice(-2),
    mm: ("0" + date.getMinutes()).slice(-2),
    ss: ("0" + date.getSeconds()).slice(-2),
  };

  return Object.keys(formatMapping).reduce(
    (formatted, key) => formatted.replace(new RegExp(key, 'g'), formatMapping[key]),
    format
  );
};
