import { RequestBuilder } from './mock/request-builder';

describe('Request builder', () => {
  it('Basic fields', () => {
    const rb = new RequestBuilder('http://localhost/api', '/operation', 'post');
    expect(rb.rootUrl).toBe('http://localhost/api');
    expect(rb.operationPath).toBe('/operation');
    expect(rb.method).toBe('post');
  });

  it('Query parameter, string value', () => {
    const rb = new RequestBuilder('http://localhost/api', '/operation', 'post');
    rb.query('p1', 'a');
    rb.query('p2', 'b');
    const request = rb.build();
    const params = request.options.params;
    if (params == null) {
      fail();
    } else {
      expect(params.get('p1')).toBe('a');
      expect(params.get('p2')).toBe('b');
    }
  });

  it('Query parameter, string array value', () => {
    const rb = new RequestBuilder('http://localhost/api', '/operation', 'post');
    rb.query('p1', ['a1', 'b1', 'c1']);
    rb.query('p2', ['a2', 'b2', 'c2'], { style: 'form', explode: false });
    rb.query('p3', ['a3', 'b3', 'c3'], { style: 'spaceDelimited', explode: true });
    rb.query('p4', ['a4', 'b4', 'c4'], { style: 'spaceDelimited', explode: false });
    rb.query('p5', ['a5', 'b5', 'c5'], { style: 'pipeDelimited', explode: true });
    rb.query('p6', ['a6', 'b6', 'c6'], { style: 'pipeDelimited', explode: false });
    const request = rb.build();
    const params = request.options.params;
    if (params == null) {
      fail();
    } else {
      expect(params.getAll('p1')).toEqual(['a1', 'b1', 'c1']);
      expect(params.getAll('p2')).toEqual(['a2,b2,c2']);
      expect(params.getAll('p3')).toEqual(['a3', 'b3', 'c3']);
      expect(params.getAll('p4')).toEqual(['a4 b4 c4']);
      expect(params.getAll('p5')).toEqual(['a5', 'b5', 'c5']);
      expect(params.getAll('p6')).toEqual(['a6|b6|c6']);
    }
  });

  it('Query parameter, object value', () => {
    const rb = new RequestBuilder('http://localhost/api', '/operation', 'post');
    rb.query('p1', { k1: 'a1', k2: 'b1', k3: 'c1' });
    rb.query('p2', { k1: 'a2', k2: 'b2', k3: 'c2' }, { style: 'form', explode: false });
    rb.query('p3', { k1: 'a3', k2: 'b3', k3: 'c3' }, { style: 'deepObject' });
    const request = rb.build();
    const params = request.options.params;
    if (params == null) {
      fail();
    } else {
      expect(params.has('p1')).toBeFalse(); // p1 uses exploded properties
      expect(params.getAll('k1')).toEqual(['a1']);
      expect(params.getAll('k2')).toEqual(['b1']);
      expect(params.getAll('k3')).toEqual(['c1']);
      expect(params.getAll('p2')).toEqual(['k1,a2,k2,b2,k3,c2']);
      expect(params.has('p3')).toBeFalse(); // p3 uses deep object
      expect(params.getAll('p3[k1]')).toEqual(['a3']);
      expect(params.getAll('p3[k2]')).toEqual(['b3']);
      expect(params.getAll('p3[k3]')).toEqual(['c3']);
    }
  });

  it('Path parameter, string value', () => {
    const rb = new RequestBuilder('http://localhost/api', '/operation/{p1}/{p2}', 'post');
    rb.path('p1', 'a');
    rb.path('p2', 'b');
    const request = rb.build();
    expect(request.url).toBe('http://localhost/api/operation/a/b');
  });

  it('Path parameter, string array value', () => {
    const rb = new RequestBuilder('http://localhost/api', '/operation/{p1}/{p2}/{p3}/{p4}/{p5}/{p6}', 'post');
    rb.path('p1', ['a1', 'b1', 'c1']);
    rb.path('p2', ['a2', 'b2', 'c2'], { explode: true });
    rb.path('p3', ['a3', 'b3', 'c3'], { style: 'label', explode: false });
    rb.path('p4', ['a4', 'b4', 'c4'], { style: 'label', explode: true });
    rb.path('p5', ['a5', 'b5', 'c5'], { style: 'matrix', explode: false });
    rb.path('p6', ['a6', 'b6', 'c6'], { style: 'matrix', explode: true });
    const request = rb.build();
    const ep1 = 'a1,b1,c1';
    const ep2 = 'a2,b2,c2';
    const ep3 = '.a3,b3,c3';
    const ep4 = '.a4.b4.c4';
    const ep5 = ';p5=a5,b5,c5';
    const ep6 = ';p6=a6;p6=b6;p6=c6';
    expect(request.url).toBe(`http://localhost/api/operation/${ep1}/${ep2}/${ep3}/${ep4}/${ep5}/${ep6}`);
  });

  it('Path parameter, object value', () => {
    const rb = new RequestBuilder('http://localhost/api', '/operation/{p1}/{p2}/{p3}/{p4}/{p5}/{p6}', 'post');
    rb.path('p1', { k1: 'a1', k2: 'b1', k3: 'c1' });
    rb.path('p2', { k1: 'a2', k2: 'b2', k3: 'c2' }, { explode: true });
    rb.path('p3', { k1: 'a3', k2: 'b3', k3: 'c3' }, { style: 'label', explode: false });
    rb.path('p4', { k1: 'a4', k2: 'b4', k3: 'c4' }, { style: 'label', explode: true });
    rb.path('p5', { k1: 'a5', k2: 'b5', k3: 'c5' }, { style: 'matrix', explode: false });
    rb.path('p6', { k1: 'a6', k2: 'b6', k3: 'c6' }, { style: 'matrix', explode: true });
    const request = rb.build();
    const ep1 = 'k1,a1,k2,b1,k3,c1';
    const ep2 = 'k1=a2,k2=b2,k3=c2';
    const ep3 = '.k1,a3,k2,b3,k3,c3';
    const ep4 = '.k1=a4.k2=b4.k3=c4';
    const ep5 = ';p5=k1,a5,k2,b5,k3,c5';
    const ep6 = ';k1=a6;k2=b6;k3=c6';
    expect(request.url).toBe(`http://localhost/api/operation/${ep1}/${ep2}/${ep3}/${ep4}/${ep5}/${ep6}`);
  });

  it('Header parameter, string value', () => {
    const rb = new RequestBuilder('http://localhost/api', '/operation', 'post');
    rb.header('p1', 'a');
    rb.header('p2', 'b');
    const request = rb.build();
    const headers = request.options.headers;
    if (headers == null) {
      fail();
    } else {
      expect(headers.get('p1')).toBe('a');
      expect(headers.get('p2')).toBe('b');
    }
  });

  it('Header parameter, string array value', () => {
    const rb = new RequestBuilder('http://localhost/api', '/operation', 'post');
    rb.header('p1', ['a1', 'b1', 'c1']);
    rb.header('p2', ['a2', 'b2', 'c2'], { explode: true });
    const request = rb.build();
    const headers = request.options.headers;
    if (headers == null) {
      fail();
    } else {
      expect(headers.getAll('p1')).toEqual(['a1', 'b1', 'c1']);
      expect(headers.getAll('p2')).toEqual(['a2', 'b2', 'c2']);
    }
  });

  it('Header parameter, object value', () => {
    const rb = new RequestBuilder('http://localhost/api', '/operation', 'post');
    rb.header('p1', { k1: 'a1', k2: 'b1', k3: 'c1' });
    rb.header('p2', { k1: 'a2', k2: 'b2', k3: 'c2' }, { explode: true });
    const request = rb.build();
    const headers = request.options.headers;
    if (headers == null) {
      fail();
    } else {
      expect(headers.getAll('p1')).toEqual(['k1,a1,k2,b1,k3,c1']);
      expect(headers.getAll('p2')).toEqual(['k1=a2,k2=b2,k3=c2']);
    }
  });
});
