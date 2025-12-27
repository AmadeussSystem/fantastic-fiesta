#include <bits/stdc++.h>
using namespace std;

int smallestSubArrayWithGivenSum(vector<int> &arr, int sum)
{
    int windowStart = 0;
    int windowSum = 0;
    int minLength = numeric_limits<int>::max();
    for (int windowEnd = 0; windowEnd < arr.size(); windowEnd++)
    {
        windowSum += arr[windowEnd];
        while (windowSum >= sum)
        {
            minLength = min(minLength, windowEnd - windowStart + 1);
            windowSum -= arr[windowStart];
            windowStart++;
        }
    }
    return minLength == numeric_limits<int>::max() ? 0 : minLength;
}
int main()
{
    // driver code
    vector<int> arr = {2, 1, 5, 2, 3, 2};
    int result = smallestSubArrayWithGivenSum(arr, 7);
    cout << result << " " << endl;
}