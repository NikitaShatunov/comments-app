import { selectPortfolio } from './select-portfolio';

export const selectMedia = {
  id: true,
  name: true,
  createdAt: true,
  description: true,
  portfolio: selectPortfolio,
};
