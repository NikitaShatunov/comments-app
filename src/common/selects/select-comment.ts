import { selectUser } from './select-user';

export const selectComment = {
  id: true,
  text: true,
  childrenCount: true,
  createdAt: true,
  user: selectUser,
};
