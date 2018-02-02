Integration tests
==========================
[![Build Status](https://travis-ci.org/balderdashy/waterline-cursor.svg?branch=master)](https://travis-ci.org/balderdashy/waterline-cursor)


A set of integration tests that test the sails-memory and sails-disk adapters against waterline-cursor edge version.


## Goals

 * Detect if a change in waterline-cursor breaks any dependent adapter tests;
 * Test using the edge version of waterline-cursor and the adapters to ensure the current snapshot of all these are working together and consequently are OK to release;
 * make it easier for waterline-cursor developers to test changes against the dependent adapters.


## What's the difference between these tests and the ones ran by the individual adapters?

The adapters are configured to run their tests against the **stable** version of waterline-cursor. From an adapter point of 
view, this makes sense since the adapter is only responsible for supporting the stable versions of its dependencies. 
These tests run against waterline-cursor **edge** version (latest in github) and the objective is to prevent changes in 
waterline-cursor to accidently break the adapters.


## What's the difference between these tests and the waterline-adapter-tests?

The set of integration tests in waterline-adapter-tests test waterline core **edge** against the adapters **edge** versions. These tests tests waterline-cursor **edge** against the adapters **edge** versions using waterline core **stable**. While the former is targeted at waterline core developers the later is targeted waterline-cursor developers.

