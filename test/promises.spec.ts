import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import options from './promises.config.json';
import petstoreSpec from './petstore-3.0.json';
import * as fs from 'fs';
import { Options } from '../lib/options';
import { OpenAPIObject } from '../lib/openapi-typings';

const spec = petstoreSpec as unknown as OpenAPIObject;

describe('Test promises generation', () => {

  it('promises', () => {
    const gen = new NgOpenApiGen(spec, {
      ...options,
      output: 'out/promises/'
    } as Options);
    gen.generate();

    // Check that the generated service methods return Promises
    const serviceFileContent = fs.readFileSync(fs.realpathSync(`${gen.outDir}/services/pets.service.ts`), 'utf8');

    // Check for Promise imports and return types
    expect(serviceFileContent).toContain('import { firstValueFrom } from \'rxjs\'');
    expect(serviceFileContent).not.toContain('import { Observable } from \'rxjs\'');

    // Check that response methods return Promise types
    expect(serviceFileContent).toMatch(/Promise<StrictHttpResponse<.*>/);
    expect(serviceFileContent).toContain('return firstValueFrom(obs)');

    // Specifically check for response methods that should return Promises
    expect(serviceFileContent).toMatch(/listPets\$Response\(.*\): Promise<StrictHttpResponse<.*>/);
    expect(serviceFileContent).toMatch(/createPets\$Response\(.*\): Promise<StrictHttpResponse<.*>/);
    expect(serviceFileContent).toMatch(/showPetById\$Response\(.*\): Promise<StrictHttpResponse<.*>/);

    // The regular methods should also return Promise when promises are configured
    expect(serviceFileContent).toMatch(/listPets\(.*\): Promise<.*>/);
    expect(serviceFileContent).toMatch(/createPets\(.*\): Promise<.*>/);
    expect(serviceFileContent).toMatch(/showPetById\(.*\): Promise<.*>/);

    // Check that body methods use Promise.then() instead of .pipe()
    expect(serviceFileContent).toContain('.then((r: StrictHttpResponse<');
    expect(serviceFileContent).not.toContain('.pipe(');
  });

});
