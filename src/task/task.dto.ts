import { PartialType } from "@nestjs/mapped-types";
import { IsString, IsOptional, IsUrl } from "class-validator";

export class CreateTaskDto {
  @IsUrl()
  targetUrl: string;

  @IsString()
  cron: string;

  @IsString()
  @IsOptional()
  payload?: string;
}

export class EditTaskDto extends PartialType(CreateTaskDto) {}
