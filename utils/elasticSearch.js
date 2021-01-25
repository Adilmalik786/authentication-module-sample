// const express = require('express');
// const elasticSearch = require('elasticsearch');
// const { catchAsync } = require('../controller/errorController');
// const flatMap = require('array.prototype.flatmap');

// const Client = new elasticSearch.Client({
//   host: 'localhost:9200',
//   log: 'trace'
// });


// exports.elasticSearchClient = Client;


// exports.createMapping = async (indexName, properties) => {
//   await Client.indices.create({
//     index: indexName,
//     body: {
//       mappings: {
//         properties
//       }
//     }
//   }, { ignore: [400] })
// }

// exports.createIndex = async (indexName, objectToIndex) => {
//   console.log('creating index')
//   // create the index in the backend
//   const { response } = await Client.create({
//     index: indexName,
//     id: objectToIndex._id,
//     body: objectToIndex.body
//   })
//   console.log('Done creating the index: ', response);
// }


// exports.pingElasticClient = _ => {
//   client.ping({
//     requestTimeout: 30000,
//   }, function (error) {
//     if (error) {
//       console.error('elasticsearch cluster is down!');
//     } else {
//       console.log('All is well');
//     }
//   });
// }


// exports.updateIndex = async (indexName, objectToUpdate) => {

//   const { response } = await Client.update({
//     index: indexName,
//     id: objectToUpdate._id,
//     body: {
//       doc: objectToUpdate.doc
//     }
//   })

//   console.log('Done Updating the document: ', response);
// }


// exports.searchIndex = async (indexName, search) => {
//   const { body: response } = await Client.search({
//     index: indexName,
//     body: {
//       query: {
//         match: {
//           title: search,
//           question: search,
//           transcribedText: search
//         }
//       }
//     }
//   })

//   console.log('Done Searching: ', response.hits.hits);
// }

// exports.bulkIndex = async (indexName, bulkData) => {
//   const body = flatMap(bulkData, doc => [{ index: { _index: indexName } }, doc]);
//   // return body;

//   const { response } = await Client.bulk({ body, refresh: true });
//   console.log(response);
// }


// exports.countIndexes = async (indexName) => {
//   const { body } = Client.count({
//     index: indexName,
//   })

//   console.log('successfully counted the indexes: ', body);
//   return body;
// }
