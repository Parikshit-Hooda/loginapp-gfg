ROOT=$(shell pwd)

test: test-integration
  
test-integration:
	@echo "\nRunning integration tests..."
	rm -rf node_modules/sails-memory/node_modules/waterline-cursor
	ln -s $(ROOT) node_modules/sails-memory/node_modules/waterline-cursor
	rm -rf node_modules/sails-disk/node_modules/waterline-cursor
	ln -s $(ROOT) node_modules/sails-disk/node_modules/waterline-cursor
	@NODE_ENV=test node test/integration/runnerDispatcher.js