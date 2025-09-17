/* eslint-disable @typescript-eslint/naming-convention */
import { filterPaths } from '../lib/ng-openapi-gen';

describe('filterPaths', () => {

  it('should include all paths if nothing is set', () => {
    const paths = {
      '/path1': { get: { tags: ['tag1'], responses: {} } },
      '/path2': { post: { tags: ['tag2'], responses: {} } },
      '/path3': { put: { tags: ['tag3'], responses: {} } },
    };
    const result = filterPaths(paths, [], [], []);
    expect(result).toEqual(paths);
  });


  it('should exclude paths based on excludePaths', () => {
    const paths = {
      '/path1': {},
      '/path2': {},
      '/path3': {},
    };

    const excludePaths = ['/path2'];

    const result = filterPaths(paths, [], excludePaths, []);

    expect(result).toEqual({
      '/path1': {},
      '/path3': {},
    });
  });

  it('should exclude paths based on excludeTags', () => {
    const paths = {
      '/path1': { get: { tags: ['tag1'], responses: {} } },
      '/path2': { post: { tags: ['tag2'], responses: {} } },
      '/path3': { put: { tags: ['tag3'], responses: {} } },
    };

    const excludeTags = ['tag2'];

    const result = filterPaths(paths, excludeTags, [], []);

    expect(result).toEqual({
      '/path1': { get: { tags: ['tag1'], responses: {} } },
      '/path3': { put: { tags: ['tag3'], responses: {} } },
    });
  });

  it('should include paths based on includeTags', () => {
    const paths = {
      '/path1': { get: { tags: ['tag1'], responses: {} } },
      '/path2': { post: { tags: ['tag2'], responses: {} } },
      '/path3': { put: { tags: ['tag3'], responses: {} } },
    };

    const includeTags = ['tag1', 'tag3'];

    const result = filterPaths(paths, [], [], includeTags);

    expect(result).toEqual({
      '/path1': { get: { tags: ['tag1'], responses: {} } },
      '/path3': { put: { tags: ['tag3'], responses: {} } },
    });
  });

  it('should handle empty paths', () => {
    const paths = {};

    const result = filterPaths(paths, ['tag1'], ['/path1'], []);

    expect(result).toEqual({});
  });

  it('should include all paths when no filters are provided', () => {
    const paths = {
      '/path1': {},
      '/path2': {},
    };

    const result = filterPaths(paths);

    expect(result).toEqual({
      '/path1': {},
      '/path2': {},
    });
  });

  it('should handle multiple filters simultaneously', () => {
    const paths = {
      '/path1': { get: { tags: ['tag1'], responses: {} } },
      '/path2': { post: { tags: ['tag2'], responses: {} } },
      '/path3': { put: { tags: ['tag3'], responses: {} } },
      '/path4': { delete: { tags: ['tag4'], responses: {} } },
    };

    const excludeTags = ['tag2', 'tag4'];
    const excludePaths = ['/path2'];
    const includeTags = ['tag1', 'tag3'];

    const result = filterPaths(paths, excludeTags, excludePaths, includeTags);

    expect(result).toEqual({
      '/path1': { get: { tags: ['tag1'], responses: {} } },
      '/path3': { put: { tags: ['tag3'], responses: {} } },
    });
  });

  it('should handle paths with no tags', () => {
    const paths = {
      '/path1': { get: { responses: {} } },
      '/path2': { post: { responses: {} } },
    };

    const result = filterPaths(paths, ['tag1'], [], []);

    expect(result).toEqual({
      '/path1': { get: { responses: {} } },
      '/path2': { post: { responses: {} } },
    });
  });

  it('should handle paths with multiple methods', () => {
    const paths = {
      '/path1': { get: { tags: ['tag1'], responses: {} }, post: { tags: ['tag2'], responses: {} } },
      '/path2': { put: { tags: ['tag3'], responses: {} }, delete: { tags: ['tag4'], responses: {} } },
    };

    const excludeTags = ['tag2', 'tag4'];
    const includeTags = ['tag1', 'tag3'];

    const result = filterPaths(paths, excludeTags, [], includeTags);

    expect(result).toEqual({
      '/path1': { get: { tags: ['tag1'], responses: {} } },
      '/path2': { put: { tags: ['tag3'], responses: {} } },
    });
  });

  it('should be case-insensitive when matching tag', () => {
    const paths = {
      '/path1': { get: { tags: ['Tag1'], responses: {} } },
      '/path2': { post: { tags: ['tag2'], responses: {} } },
    };

    const excludeTags = ['tag1'];
    const includeTags = ['TAG2'];

    const result = filterPaths(paths, excludeTags, [], includeTags);

    console.log(result);
    expect(result).toEqual({});
  });

  it('should exclude paths with no remaining methods', () => {
    const paths = {
      '/path1': { get: { tags: ['tag1'], responses: {} } },
      '/path2': { post: { tags: ['tag2'], responses: {} } },
    };

    const excludeTags = ['tag1', 'tag2'];

    const result = filterPaths(paths, excludeTags, [], []);

    expect(result).toEqual({});
  });

  it('should not modify the original paths object', () => {
    const paths = {
      '/path1': { get: { tags: ['tag1'], responses: {} } },
      '/path2': { post: { tags: ['tag2'], responses: {} } },
    };

    const excludeTags = ['tag2'];

    const result = filterPaths(paths, excludeTags, [], []);

    // Ensure the original object is not modified
    expect(paths).toEqual({
      '/path1': { get: { tags: ['tag1'], responses: {} } },
      '/path2': { post: { tags: ['tag2'], responses: {} } },
    });

    // Ensure the result is correct
    expect(result).toEqual({
      '/path1': { get: { tags: ['tag1'], responses: {} } },
    });
  });
});
