import * as fs from 'fs-extra';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { OpenAPIObject } from '../lib/openapi-typings';
import { Options } from '../lib/options';
import options from './multi-tag-operations.config.json';
import spec from './multi-tag-operations.json';

const gen = new NgOpenApiGen(spec as OpenAPIObject, options as Options);
gen.generate();

/**
 * Collects the exported names of every re-export in an index file, so that duplicates can be
 * spotted. Handles both the plain form (`export { A }`) and the aliased form
 * (`export { A as B }`, where `B` is the exported name). Types and values live in separate
 * namespaces, so type exports are kept apart from value exports by a prefix.
 */
function exportedNames(content: string): string[] {
  const names: string[] = [];
  const regex = /^export (type )?\{([^}]+)}/gm;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    const kind = match[1] ? 'type' : 'value';
    for (const item of match[2].split(',')) {
      const parts = item.trim().split(/\s+as\s+/);
      names.push(`${kind}:${parts[parts.length - 1]}`);
    }
  }
  return names;
}

describe('Generation tests using multi-tag-operations.json', () => {
  const functionsFile = fs.readFileSync(`${gen.outDir}/functions.ts`, 'utf8');
  const indexFile = fs.readFileSync(`${gen.outDir}/index.ts`, 'utf8');

  for (const [name, content] of [['functions.ts', functionsFile], ['index.ts', indexFile]]) {
    describe(name, () => {
      it('should never export the same name twice', () => {
        const names = exportedNames(content);
        expect(names.length).toBeGreaterThan(0);
        expect(names.length).toBe(new Set(names).size);
      });

      it('should export an operation with multiple tags only once', () => {
        // The operation declares both `Appointment` and `Called by frontend`, yet it is a single
        // operation: exporting it once per tag would be a duplicate identifier
        const occurrences = content.match(/export \{ deleteAppointment as \S+ }/g);
        expect(occurrences).toEqual(['export { deleteAppointment as deleteAppointment }']);
        expect(content).toContain(
          'export type { DeleteAppointment$Params as DeleteAppointment$Params } from \'./fn/appointment/delete-appointment\'');
        // No tag suffix, as there is nothing to disambiguate from
        expect(content).not.toContain('deleteAppointmentAppointment');
        expect(content).not.toContain('deleteAppointmentCalledByFrontend');
      });
    });
  }

  it('should write the function of a multi-tagged operation under its first tag only', () => {
    expect(fs.existsSync(`${gen.outDir}/fn/appointment/delete-appointment.ts`)).toBe(true);
    expect(fs.existsSync(`${gen.outDir}/fn/called-by-frontend`)).toBe(false);
  });

  it('should generate a service per tag, both reusing the single function', () => {
    const appointment = fs.readFileSync(`${gen.outDir}/services/appointment.service.ts`, 'utf8');
    const calledByFrontend = fs.readFileSync(`${gen.outDir}/services/called-by-frontend.service.ts`, 'utf8');
    for (const service of [appointment, calledByFrontend]) {
      expect(service).toContain('import { deleteAppointment } from \'../fn/appointment/delete-appointment\';');
      expect(service).toContain('deleteAppointment(');
    }
  });
});
