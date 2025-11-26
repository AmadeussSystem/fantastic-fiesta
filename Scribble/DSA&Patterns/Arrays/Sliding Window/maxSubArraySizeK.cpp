#include <bits/stdc++.h>
using namespace std;


int getMaxSubArraySizeK(vector<int> &arr,int k){
    int windowSum = 0;
    int windowStart = 0;
    int maxSum = 0;
    for(int windowEnd = 0; windowEnd < arr.size(); windowEnd++){
        windowSum += arr[windowEnd];
        if(windowEnd >= k - 1){
           maxSum = max(windowSum,maxSum);
           windowSum -= arr[windowStart];
           windowStart++;
        }
    }
    return maxSum;
}
int main(){
    //driver code 
    vector<int> arr = {2 , 1, 5 ,1 ,3 , 2};
    int result = getMaxSubArraySizeK(arr ,3);
    cout<<result;
}