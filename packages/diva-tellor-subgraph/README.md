<!--
*** Thanks for checking out the Best-README-Template. If you have a suggestion
*** that would make this better, please fork the repo and create a pull request
*** or simply open an issue with the tag "enhancement".
*** Thanks again! Now go create something AMAZING! :D
***
***
***
*** To avoid retyping too much info. Do a search and replace for the following:
*** github_username, repo_name, twitter_handle, email, project_title, project_description
-->



<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]


<!-- PROJECT LOGO -->
<br />
<p align="center">
  <h2 align="center">tellorFlex-oracle-matich-graph</h2>

  <p align="center">
    This is the subgraph code for the TellorFlex Oracle contract on Polygon Mainnet.
    <br />
    <br />
    <a href="https://github.com/tellor-io/tellorFlex-oracle-matich-graph/issues">Report Bug</a>
    ·
    <a href="https://github.com/tellor-io/tellorFlex-oracle-matich-graph/issues">Request Feature</a>
  </p>
</p>



<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary><h2 style="display: inline-block">Table of Contents</h2></summary>
  <ol>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgements">Acknowledgements</a></li>
  </ol>
</details>



<!-- GETTING STARTED -->
## Getting Started

To get a local copy up and running follow these simple steps.

### Installation

1. Clone the repo in your preferred directory
   ```sh
   git clone https://github.com/tellor-io/tellorFlex-oracle-matich-graph.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. To regenerate code files after changing graphql schema, run:
   ```sh
   graph codegen
   ```
4. To build code files after changing src/mapping.ts file, run:
   ```sh
   graph build
   ```
5. To deploy your subgraph after successful generation and build, run:
   ```sh
   graph deploy --product hosted-service <GITHUB_USER>/<SUBGRAPH NAME>
   ```

## Using subgraph studio

```
yarn codegen
yarn build
yarn graph:auth
yarn deploy-goerli diva-tellor-goerli
```

You can find the subgraph slug as well as the deploy key here: https://thegraph.com/studio/subgraph/diva-tellor-goerli/

There you also have to publish the subgraph which will cost some GRT. Before publishing, you have to to signal with 100 GRT for auto-migration curation. You will
see a notification at the bottom when you press the publish button.

## Trouble shooting
* `Event with signature 'NewReport(indexed bytes32,indexed uint256,bytes,uint256,bytes,indexed address)' not present in ABI 'Contract'`: check
whether the `event` in `eventHandlers` in `subgraph.yaml` file is correctly defined. In particular, check against the ABI file whether the argument types are correct and 
`index` flag is used correctly.

<!-- ROADMAP -->
## Roadmap

See the [open issues](https://github.com/tellor-io/tellorFlex-oracle-matich-graph/issues) for a list of proposed features (and known issues).

<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

<!-- CONTACT -->
## Contact

Tellor.io 
- [Documentation](https://docs.tellor.io/tellor/)
- [Twitter](https://twitter.com/WeAreTellor)
- [Discord](https://discord.gg/NP7fmzr5)
- [GitHub](https://github.com/tellor-io)
- [YouTube](https://www.youtube.com/tellor)

<!-- ACKNOWLEDGEMENTS -->

## Acknowledgements

* [README Acknowledgement](https://github.com/othneildrew/Best-README-Template)

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/tellor-io/tellorFlex-oracle-matich-graph.svg?style=for-the-badge
[contributors-url]: https://github.com/tellor-io/tellorFlex-oracle-matich-graph/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/tellor-io/tellorFlex-oracle-matich-graph.svg?style=for-the-badge
[forks-url]: https://github.com/tellor-io/tellorFlex-oracle-matich-graph/network/members
[stars-shield]: https://img.shields.io/github/stars/tellor-io/tellorFlex-oracle-matich-graph.svg?style=for-the-badge
[stars-url]: https://github.com/tellor-io/tellorFlex-oracle-matich-graph/stargazers
[issues-shield]: https://img.shields.io/github/issues/tellor-io/tellorFlex-oracle-matich-graph.svg?style=for-the-badge
[issues-url]: https://github.com/tellor-io/tellorFlex-oracle-matich-graph/issues
[license-shield]: https://img.shields.io/github/license/tellor-io/tellorFlex-oracle-matich-graph.svg?style=for-the-badge
[license-url]: https://github.com/tellor-io/tellorFlex-oracle-matich-graph/blob/main/LICENSE.txt

