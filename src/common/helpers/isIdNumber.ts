import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Checks if a given id is a number.
 * @param id Id to check.
 * @param name Name of the object the id is for (for error message).
 * @throws {HttpException} With BAD_REQUEST status if id is not a number.
 */
function isIdNumber(id: any, name: string) {
  if (!id) {
    throw new HttpException(
      `Id of the ${name} must be a number.`,
      HttpStatus.BAD_REQUEST,
    );
  }
}
export { isIdNumber };
