REPORTER = spec

all: jshint test

test:
	@NODE_ENV=test ./node_modules/.bin/mocha --recursive --reporter $(REPORTER) --timeout 3000

jshint:
	jshint test index.js

tests: test

clean:
	rm -f var/*

.PHONY: clean test jshint