let ignoreNextNull = false;

export const setIgnoreNextAuthNull = (value: boolean) => {
  ignoreNextNull = value;
};

export const consumeIgnoreNextAuthNull = () => {
  const shouldIgnore = ignoreNextNull;
  ignoreNextNull = false; // Reset after consuming
  return shouldIgnore;
};
