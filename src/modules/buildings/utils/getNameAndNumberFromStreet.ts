export const getNameAndNumberFromStreet = (street: String) => {
  const streetSplitted = street.split(" ");

  let streetStringsArr = streetSplitted.filter((s) => isNaN(Number(s)));
  const streetString = streetStringsArr.join(" ");

  let numberStringsArr = streetSplitted.filter((s) => !isNaN(Number(s)));
  let propertyNumber;
  if (numberStringsArr.length === 0 || numberStringsArr[0] === "")
    propertyNumber = -1;
  else propertyNumber = Number(numberStringsArr.join(""));
  return {
    streetString,
    propertyNumber,
  };
};
