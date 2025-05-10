import { expect } from "chai";
import { queryOpenAI } from "../src/ai/openaiClient.js";

describe("OpenAI Client", () => {
  it("should return a valid response from the API", async () => {
    const result = await queryOpenAI("List files in the current directory");
    expect(result).to.be.a("string").and.to.include("ls");
  });
});