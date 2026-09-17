export const formatValidationError = (errors) => {
  if (!errors || !errors.issues || !Array.isArray(errors.issues)) return 'Unknown validation error';

  return errors.issues.map((issue) => issue.message).join(', ');
};