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
import parser from "cron-parser";

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

@ValidatorConstraint({ name: "CronValidator", async: false })
class CronValidator implements ValidatorConstraintInterface {
  validate(cron: string, args: ValidationArguments): boolean {
    if (typeof cron !== "string") {
      return false;
    }

    try {
      parser.parse(cron);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments): string {
    return "Must be a valid cron expression.";
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
  @Validate(CronValidator)
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
