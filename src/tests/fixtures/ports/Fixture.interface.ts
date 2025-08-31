import { TestApp } from "@/tests/utils/TestApp";

export interface IFixture {
  load(app: TestApp): Promise<void>;
}
