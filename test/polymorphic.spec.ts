import { InterfaceDeclaration, TypescriptParser } from "typescript-parser";
import { NgOpenApiGen } from "../lib/ng-openapi-gen";
import options from "./polymorphic.config.json";
import selfRef from "./polymorphic.json";

const gen = new NgOpenApiGen(selfRef, options);
gen.generate();

describe("Generation of derived classes using polymorphic.json (as is generated by Swashbuckle)", () => {
  it("Tazk model", (done) => {
    const tazk = gen.models.get("Foo.Bar.Tazk");
    const ts = gen.templates.apply("model", tazk);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then((ast) => {
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe("Tazk");
      expect(decl.properties).toHaveSize(1);
      expect(decl.properties[0].name).toBe("taskNumber");
    });
    done();
  });
  // const baz = gen.models.get("Foo.Bar.Baz");
  // const ts = gen.templates.apply("model", baz);
  // const parser = new TypescriptParser();
  // parser.parseSource(ts).then((ast) => {
  //   expect(ast.declarations.length).toBe(1);
  //   expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
  //   const decl = ast.declarations[0] as InterfaceDeclaration;
  //   expect(decl.name).toBe("Baz");
  //   expect(decl.properties.length).toBe(3);
  //   const ref = decl.properties.find((p) => p.name === "refProperty");
  //   expect(ref).withContext("refProperty property").toBeDefined();
  //   if (ref) {
  //     expect(ref.type).toBe("Baz");
  //   }
  //   const array = decl.properties.find((p) => p.name === "arrayProperty");
  //   expect(array).withContext("arrayProperty property").toBeDefined();
  //   if (array) {
  //     expect(array.type).toBe("Array<Baz>");
  //   }
  //   const object = decl.properties.find((p) => p.name === "objectProperty");
  //   expect(object).withContext("objectProperty property").toBeDefined();
  //   if (object) {
  //     expect(object.type).toBe(
  //       `{ 'nestedArray': Array<Baz>, 'nestedRef': Baz }`
  //     );
  //  }
  //   done();
  // });
  //});
});
