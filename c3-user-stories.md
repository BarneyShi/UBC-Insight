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
As a \<role\>, I want to \<goal\>, so that \<benefit\>.


#### Definitions of Done(s)
Scenario 1: \<The name for the behaviour that will be described\>  
Given: \<Some initial application state (precondition)\>  
When: \<The user do some series of action\>  
Then: \<Some outcome state is expected (post-condition)\>

## Others
You may provide any additional user stories + DoDs in this section for general TA feedback.  
Note: These will not be graded.
