import { Property } from "./abstractions";
import { flatMapLatest } from "./flatmaplatest";
import { never } from "./never";
import { constant, toProperty } from "./property";
import { expectPropertyEvents, expectStreamEvents, series } from "./test-utils";
import { nop } from "./util"


describe("EventStream.flatMapLatest", () => {
  describe("spawns new streams but collects values from the latest spawned stream only", () =>
    expectStreamEvents(
      () => flatMapLatest(value => series(2, [value, value]))(series(3, [1, 2])) ,
      [1, 2, 2])
  );
  it("toString", () => expect(flatMapLatest(nop as any)(never()).toString()).toEqual("never.flatMapLatest(fn)"));
});

describe("Property.flatMapLatest", function() {
  describe("switches to new source property", () =>
    expectPropertyEvents(
      () => {
          const property = toProperty(0)(series(3, [1, 2]))
          const spawner = (value: number) => toProperty(value + "." + 0)(series(2, [value + "." + 1, value + "." + 2]))
          return flatMapLatest(spawner)(property)
      }, 
      ["0.0", "0.1", "1.0", "1.1", "2.0", "2.1", "2.2"])
  );
  it("toString", () => expect(flatMapLatest(nop as any)(constant(1)).toString()).toEqual("constant(1).flatMapLatest(fn)"));
})