import { test } from 'node:test';
import assert from 'node:assert/strict';
import { siteHost, websiteUrl } from './profile.ts';

test('websiteUrl adds https only when the scheme is missing', () => {
  assert.equal(websiteUrl(' uniswap.org '), 'https://uniswap.org');
  assert.equal(websiteUrl('http://a.xyz/x'), 'http://a.xyz/x');
  assert.equal(websiteUrl('HTTPS://A.xyz'), 'HTTPS://A.xyz');
  assert.equal(websiteUrl('  '), undefined);
});

test('siteHost keeps just the domain', () => {
  assert.equal(siteHost('https://www.uniswap.org/swap?x=1'), 'uniswap.org');
  assert.equal(siteHost('http://app.zora.co#mint'), 'app.zora.co');
});
