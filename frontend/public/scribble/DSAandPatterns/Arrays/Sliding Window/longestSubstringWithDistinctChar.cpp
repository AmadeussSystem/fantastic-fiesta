#include <bits/stdc++.h>
using namespace std;


int longestSubstringWithDistinctChar(string st , int k){
    int windowStart = 0;
    int maxLength = 0;
    unordered_map<char,int> charFreq;
    for(int windowEnd = 0; windowEnd <= st.size(); windowEnd++){
        char rightChar = st[windowEnd];
        charFreq[rightChar]++;
        while(charFreq.size() > k){
            char leftChar = st[windowStart];
            charFreq[leftChar]--;
            if(charFreq[rightChar]==0) charFreq.erase(leftChar);
            windowStart++;
        }       
        maxLength = max(maxLength,windowEnd - windowStart + 1);                                                                                                                                                                                                                                                                                                                                                                            
    }
    return maxLength;
}
int main(){
    //driver code 
    string st = "araaci";
    int result = longestSubstringWithDistinctChar(st,2);
    cout<<result<<" ";
}