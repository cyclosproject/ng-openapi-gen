import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import options from './observables.config.json';
import petstoreSpec from './petstore-3.0.json';
import * as fs from 'fs';
import { Options } from '../lib/options';
import { OpenAPIObject } from '../lib/openapi-typings';

const spec = petstoreSpec as unknown as OpenAPIObject;

describe('Test observables generation', () => {

  it('observables', () => {
    const gen = new NgOpenApiGen(spec, {
      ...options,
      output: 'out/observables/'
    } as Options);
    gen.generate();

    // Check that the generated service methods return Observables
    const serviceFileContent = fs.readFileSync(fs.realpathSync(`${gen.outDir}/services/pets.service.ts`), 'utf8');

    // Check for Observable imports and return types
    expect(serviceFileContent).toContain('import { Observable } from \'rxjs\'');
    expect(serviceFileContent).not.toContain('import { firstValueFrom } from \'rxjs\'');

    // Check that response methods return Observable types instead of Promise
    expect(serviceFileContent).toMatch(/Observable<StrictHttpResponse<.*>/);
    expect(serviceFileContent).toContain('return obs');
    expect(serviceFileContent).not.toContain('return firstValueFrom(obs)');

    // Specifically check for response methods that should return Observables
    expect(serviceFileContent).toMatch(/listPets\$Response\(.*\): Observable<StrictHttpResponse<.*>/);
    expect(serviceFileContent).toMatch(/createPets\$Response\(.*\): Observable<StrictHttpResponse<.*>/);
    expect(serviceFileContent).toMatch(/showPetById\$Response\(.*\): Observable<StrictHttpResponse<.*>/);

    // The regular methods should also return Observable
    expect(serviceFileContent).toMatch(/listPets\(.*\): Observable<.*>/);
    expect(serviceFileContent).toMatch(/createPets\(.*\): Observable<.*>/);
    expect(serviceFileContent).toMatch(/showPetById\(.*\): Observable<.*>/);

    // Check that body methods use .pipe() instead of Promise.then()
    expect(serviceFileContent).toContain('.pipe(');
    expect(serviceFileContent).not.toContain('.then((r: StrictHttpResponse<');
  });

});
