Please edit this template and commit to the master branch for your user stories submission.   
Make sure to follow the *Role, Goal, Benefit* framework for the user stories and the *Given/When/Then* framework for the Definitions of Done! You can also refer to the examples DoDs in [C3 spec](https://sites.google.com/view/ubc-cpsc310-21w2-intro-to-se/project/checkpoint-3).

## User Story 1
As a user, I want to upload and delete datasets and so that I can select one and query it.


#### Definitions of Done(s)
Scenario 1: Upload a local zip file containing datasets
Given: The website doesn't have any datasets  
When: Users select a dataset and upload it.  
Then: 
  - There will be a prompt notifying it's been uploaded. 
  - The dataset will be saved as a copy in the server. 
  - And there will be a table containing all uploaded datasets with rows.

Scenario 2: Upload a datasets that already exsits.
Given: The website contains a datasets with the same ID.
When: Users select a dataset and upload it.  
Then: There will be a prompt saying it's already existed.

Scenario 3: Select a dataset to delete.
Given: The website contains multiple datasets.
When: Users select a dataset by clicking the checkbox and click on `delete` button. 
Then: 
  - The dataset will be deleted from the dataset table, 
  - Its copy will also by deleted from the server.

## User Story 2
As a student, I want to query courses in a particular department that have a minimum course average and order
by course average, so that I can know which courses to take to potentially boost my GPA.


#### Definitions of Done(s)
Scenario 1: The result of the query has too many courses.
Given: The website has a courses dataset.
When: The user enters a query which is too broad.
Then: There will be a prompt saying "Query has too many courses. Try narrowing your search."

Scenario 2: The result of the query is valid.
Given: The website has a courses dataset.
When: The user enters a valid query with a valid result.
Then: Courses will be displayed with required fields (given by COLUMNS in the query), and are scrollable.

Scenario 3: The query is invalid.
Given: The website has a courses dataset.
When: The user enters an invalid query.
Then: There will be a prompt saying "Your query is invalid. Please double check your input."

Scenario 4: The result of the query is empty.
Given: The website has a courses dataset.
When: The user enters a valid query with an empty result.
Then: There will be a prompt saying "There are no courses that meet your requirements. Try broadening your search."



## Others
You may provide any additional user stories + DoDs in this section for general TA feedback.  
Note: These will not be graded.
