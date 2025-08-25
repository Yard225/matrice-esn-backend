import { BadRequestException } from '@nestjs/common';

export class DateRange {
  private readonly _startDate: Date;
  private readonly _endDate: Date;

  private constructor(startDate: Date, endDate: Date) {
    this._startDate = startDate;
    this._endDate = endDate;
  }

  public static create(startDate: Date, endDate: Date): DateRange {
    if (!startDate || !endDate) {
      throw new BadRequestException('Start date and end date are required');
    }

    if (startDate >= endDate) {
      throw new BadRequestException('Start date must be before end date');
    }

    return new DateRange(startDate, endDate);
  }

  public static createFromDays(days: number): DateRange {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    return new DateRange(startDate, endDate);
  }

  public get startDate(): Date {
    return this._startDate;
  }

  public get endDate(): Date {
    return this._endDate;
  }

  public getDurationInDays(): number {
    const diffTime = this._endDate.getTime() - this._startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  public contains(date: Date): boolean {
    return date >= this._startDate && date <= this._endDate;
  }

  public overlaps(other: DateRange): boolean {
    return this._startDate <= other._endDate && this._endDate >= other._startDate;
  }

  public equals(other: DateRange): boolean {
    return this._startDate.getTime() === other._startDate.getTime() &&
           this._endDate.getTime() === other._endDate.getTime();
  }
}