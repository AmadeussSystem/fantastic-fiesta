#include <bits/stdc++.h>
using namespace std;

vector<double> getAvgContiguousSizeK(vector<double> &arr, int k)
{
    vector<double> result;
    int windowStart = 0;
    double windowSum = 0; // use double to match arr's element type
    for (int windowEnd = 0; windowEnd < arr.size(); windowEnd++)
    {
        windowSum += arr[windowEnd];
        if (windowEnd >= k - 1)
        {
            // append the average for the current window
            result.push_back(windowSum / k);̥
            windowSum -= arr[windowStart];
            windowStart++;
        }
    }
    return result;
}
int main()
{
    // driver code
    vector<double> arr = {10, 2, 4.2, 1, 32, 2, 4, 6};
    vector<double> result = getAvgContiguousSizeK(arr, 3);
    for (auto i : result)
    {
        cout << i<<" , ";
    }
}