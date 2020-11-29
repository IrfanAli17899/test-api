const randRange = (min, max, integers = true) => {
  const value = min + Math.random() * (max + +integers - min);
  return integers ? Math.floor(value) : value;
};

const randBool = () => !!Math.round(Math.random());

const randString = (length, { letters = true, numbers = true, capitals = true }) => {
  let result = '';

  if (!letters && !numbers) {
    return result;
  }

  while (result.length < length) {
    let additive = Math.random().toString(36).slice(2, 12);
    if (!letters) additive = additive.replace(/[a-z]/ig, '');
    if (!numbers) additive = additive.replace(/\d/g, '');
    if (capitals) additive = additive.replace(/./g, (char) => (randBool() ? char.toUpperCase() : char));
    result += additive;
  }

  return result.slice(0, length);
};

module.exports = {
  randRange,
  randBool,
  randString,
};
