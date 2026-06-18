import { PartialType } from "@nestjs/mapped-types";
import {
  IsString,
  IsOptional,
  IsUrl,
  IsIn,
  IsObject,
  IsBoolean,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

@ValidatorConstraint({ name: "PayloadAllowed", async: false })
class PayloadAllowedValidator implements ValidatorConstraintInterface {
  validate(payload: any, args: ValidationArguments) {
    const dto = args.object as CreateTaskDto;
    const method = (dto.method || "POST").toUpperCase();
    const methodsAllowingPayload = ["POST", "PUT", "PATCH"];

    if (payload === undefined || payload === null || payload === "") {
      return true;
    }

    return methodsAllowingPayload.includes(method);
  }

  defaultMessage() {
    return "Payload is only allowed for POST, PUT, or PATCH methods";
  }
}

export class CreateTaskDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  targetUrl!: string;

  @IsIn(["GET", "POST", "PUT", "PATCH", "DELETE"])
  @IsOptional()
  method?: string;

  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;

  @IsString()
  cron!: string;

  @IsString()
  @IsOptional()
  @Validate(PayloadAllowedValidator)
  payload?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class EditTaskDto extends PartialType(CreateTaskDto) {}
