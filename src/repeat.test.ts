import * as Bacon from "..";
import { later } from "./later";
import { repeat } from "./repeat";

import { expectStreamEvents } from "./test-utils";

describe("repeat", function() {
  describe("Polls new streams from generator function until empty result", () =>
    expectStreamEvents(
      function() {
        let count = 0;
        return repeat(function(iteration) {
          count++;
          if (count <= 3) {
            return later(1, count * iteration);
          }
        });
      },
      [0,2,6])
  );
});
