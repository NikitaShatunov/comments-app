import { HttpException, HttpStatus } from "@nestjs/common";
import { Not, Repository } from "typeorm";

/**
 * @description
 * Checks if a property value is unique in the repository.
 * @param propertyName Name of the property to check.
 * @param propertyValue Value of the property to check.
 * @param repository Repository to check in.
 * @param id Optional: ID of the record to exclude from the check.
 * @returns Promise that resolves if the property value is unique, or rejects with a HttpException if it is not.
 */
async function isUniquePropertyValue(propertyName: string, propertyValue: any, repository: Repository<any>, id?: any): Promise<void> {
  const whereClause: any = {};
  if (id !== undefined) {
    // exclude the record with the given ID from the result
    whereClause.id = Not(id);
  }
  // search for a record with the given property value
  whereClause[propertyName] = propertyValue;
  const field = await repository.findOne({
    where: whereClause,
  });

  if (field) {
    // if a record with the given property value is found, throw an exception
    throw new HttpException(`There already is record with ${propertyName}: ${propertyValue}`, HttpStatus.BAD_REQUEST);
  }
}
export { isUniquePropertyValue };
