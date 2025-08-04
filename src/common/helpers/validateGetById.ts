import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Throws HttpException with NOT_FOUND status if item is undefined.
 * @param id Id of the item to validate.
 * @param item Item to validate.
 * @param name Name of the item (for error message).
 */
function validateGetById(id: number, item: any, name: string) {
  if (!item) {
    throw new HttpException(
      `There is no ${name} with id: ${id}`,
      HttpStatus.NOT_FOUND,
    );
  }
}
export { validateGetById };
